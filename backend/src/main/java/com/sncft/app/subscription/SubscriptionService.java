package com.sncft.app.subscription;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sncft.app.psp.PaymentInitiateResponse;
import com.sncft.app.psp.PspService;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.ticket.Transaction;
import com.sncft.app.ticket.TransactionRepository;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.sncft.app.shared.config.AppConstants.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionMapper subscriptionMapper;
    private final UserRepository userRepository;
    private final PspService pspService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final TransactionRepository transactionRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<SubscriptionResponse> getSubscriptionsByStatusIn(Collection<SubscriptionStatus> statuses, Pageable pageable) {
        User user = getCurrentUser();
        Page<Subscription> pageResult = subscriptionRepository.findByUserIdAndStatusIn(user.getId(), statuses, pageable);

        List<SubscriptionResponse> content = pageResult.getContent().stream()
                .map(subscriptionMapper::toResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.of(pageResult, content);
    }

    @Transactional
    public PaymentInitiateResponse initiatePayment(UUID subscriptionId) {
        User user = getCurrentUser();
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Abonnement non trouvé"));

        // check if  subscription belongs to user
        if (!sub.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Ce n'est pas votre abonnement");
        }

        // check if subscription is awaiting payment or expired civil
        boolean isAwaitingPayment = sub.getStatus() == SubscriptionStatus.AWAITING_PAYMENT;
        boolean isExpiredCivil = sub.getStatus() == SubscriptionStatus.EXPIRED
                && sub.getRequest().getCategory().getName().equals(SubscriptionCategoryType.CIVIL);

        if (!(isAwaitingPayment || isExpiredCivil)) {
            throw new DataConflictException("Cet abonnement ne peut plus être payé");
        }

        // Check if a payment session already exists for this user
        String userLockKey = USER_LOCK_KEY_PREFIX + user.getId();
        String existingSession = redisTemplate.opsForValue().get(userLockKey);
        if (existingSession != null) {
            return new PaymentInitiateResponse(UUID.fromString(existingSession));
        }

        // Determine price
        BigDecimal price = sub.getRequest().getDuration() == SubscriptionDuration.MONTHLY 
                ? sub.getRequest().getCategory().getMonthlyPrice()
                : sub.getRequest().getCategory().getQuarterlyPrice();

        // Create PSP session
        UUID pspSessionId = pspService.createPaymentSession(price);

        // Save Context in Redis
        Map<String, String> context = new HashMap<>();
        context.put("requestId", sub.getRequest().getId().toString());
        context.put("subscriptionId", sub.getId().toString());
        context.put("userId", user.getId().toString());
        context.put("amount", price.toString());

        try {
            redisTemplate.opsForValue().set(SUBSCRIPTION_CONTEXT_KEY_PREFIX + pspSessionId, 
                    objectMapper.writeValueAsString(context), Duration.ofMinutes(15));
            redisTemplate.opsForValue().set(userLockKey, pspSessionId.toString(), Duration.ofMinutes(15));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erreur lors de la sauvegarde du contexte de paiement", e);
        }

        return new PaymentInitiateResponse(pspSessionId);
    }

    @Transactional
    public void finalizePayment(UUID pspSessionId, String pspTransactionId) {
        String contextJson = redisTemplate.opsForValue().get(SUBSCRIPTION_CONTEXT_KEY_PREFIX + pspSessionId);
        if (contextJson == null) return;

        try {
            Map<String, String> data = objectMapper.readValue(contextJson, new TypeReference<Map<String, String>>() {});
            UUID subId = UUID.fromString(data.get("subscriptionId"));
            BigDecimal amount = new BigDecimal(data.get("amount"));
            UUID userId = UUID.fromString(data.get("userId"));

            Subscription sub = subscriptionRepository.findById(subId).orElseThrow();
            User user = userRepository.findById(userId).orElseThrow();

            // Update Subscription status and dates
            int months = sub.getRequest().getDuration() == SubscriptionDuration.MONTHLY ? 1 : 3;
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setExpireDate(LocalDate.now().plusMonths(months));
            subscriptionRepository.save(sub);

            // Record Transaction
            Transaction trans = Transaction.builder()
                    .user(user)
                    .targetId(sub.getId())
                    .targetType(TRANSACTION_TARGET_SUBSCRIPTION)
                    .amount(amount)
                    .type(TRANSACTION_TYPE_PAYMENT)
                    .pspTransactionId(pspTransactionId)
                    .status(TRANSACTION_STATUS_SUCCESS)
                    .build();
            transactionRepository.save(trans);

            // Cleanup
            redisTemplate.delete(SUBSCRIPTION_CONTEXT_KEY_PREFIX + pspSessionId);
            redisTemplate.delete(USER_LOCK_KEY_PREFIX + userId);

        } catch (Exception e) {
            log.error("Erreur lors de la finalisation du paiement de l'abonnement", e);
            throw new RuntimeException(e);
        }
    }

    /*
     * delete payment session when payment fail
     */
    @Transactional
    public void handlePaymentFailure(UUID pspSessionId) {
        String contextJson = redisTemplate.opsForValue().get(SUBSCRIPTION_CONTEXT_KEY_PREFIX + pspSessionId);
        if (contextJson != null) {
            try {
                Map<String, String> data = objectMapper.readValue(contextJson, new TypeReference<Map<String, String>>() {});
                UUID userId = UUID.fromString(data.get("userId"));
                redisTemplate.delete(USER_LOCK_KEY_PREFIX + userId);
            } catch (Exception e) {
                log.error("Failed to parse subscription context for failure cleanup", e);
            }
        }
        redisTemplate.delete(SUBSCRIPTION_CONTEXT_KEY_PREFIX + pspSessionId);
    }

    /**
     * Daily cron at midnight — expires subscriptions past their end date.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void checkSubscriptionExpirations() {
        log.info("Checking for expired subscriptions...");
        int updatedCount = subscriptionRepository.updateExpiredSubscriptions(LocalDate.now());
        if (updatedCount > 0) {
            log.info("Successfully expired {} subscriptions.", updatedCount);
        }
    }
}
