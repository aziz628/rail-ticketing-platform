package com.sncft.app.psp;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.MaxAttemptsReachedException;
import com.sncft.app.shared.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PspService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String PSP_SESSION_PREFIX = "psp:session:";
    private static final String PSP_ATTEMPTS_PREFIX = "psp:attempts:";
    private static final String TRANSACTION_ID_PREFIX = "PSP-";
    private static final Duration PSP_TIMEOUT = Duration.ofMinutes(10);

    /**
     * Just creates a payment session for an amount.
     * PSP doesn't know about trips or users.
     */
    public UUID createPaymentSession(BigDecimal amount) {
        UUID pspSessionId = UUID.randomUUID();
        redisTemplate.opsForValue().set(PSP_SESSION_PREFIX + pspSessionId, amount.toString(), PSP_TIMEOUT);
        redisTemplate.opsForValue().set(PSP_ATTEMPTS_PREFIX + pspSessionId, "0", PSP_TIMEOUT);
        return pspSessionId;
    }

    public BigDecimal getSessionAmount(UUID pspSessionId) {
        String amountStr = redisTemplate.opsForValue().get(PSP_SESSION_PREFIX + pspSessionId);
        if (amountStr == null) {
            throw new ResourceNotFoundException("Session de paiement expirée");
        }
        return new BigDecimal(amountStr);
    }

    public PspSessionResponse getSession(UUID pspSessionId) {
        BigDecimal amount = getSessionAmount(pspSessionId);
        Long remainingTime = redisTemplate.getExpire(PSP_SESSION_PREFIX + pspSessionId);
        return new PspSessionResponse(pspSessionId, amount, remainingTime);
    }

    public void incrementAndCheckMaxAttempts(UUID pspSessionId) {
        // increment attempts 
        String key = PSP_ATTEMPTS_PREFIX + pspSessionId;
        Long attempts = redisTemplate.opsForValue().increment(key);
        // return if max attempts reached
        if (attempts != null && attempts >= 3) {
            // delete session and attempts
            redisTemplate.delete(PSP_SESSION_PREFIX + pspSessionId);
            redisTemplate.delete(key);
            throw new MaxAttemptsReachedException("Nombre maximal d'essais atteint. Session expirée.");
        }
    }

    public String processPayment(PspPayRequest request) {
        BigDecimal amount = getSessionAmount(request.pspSessionId());

        try {

            InputStream inputStream = new ClassPathResource("mock-data/mock-psp-cards.json").getInputStream();
            List<Map<String, Object>> cards = objectMapper.readValue(inputStream, new TypeReference<List<Map<String, Object>>>() {});

            // find a card that matches the request
            Map<String, Object> matchingCard = cards.stream()
                // remove spaces from card number and compare
                .filter(c -> c.get("number").toString().replace(" ", "").equals(request.cardNumber().replace(" ", "")))
                .filter(c -> c.get("cvv").toString().equals(request.cvv()))
                .filter(c -> c.get("expiry").toString().equals(request.expiryDate()))
                .findFirst()
                .orElse(null);

            // if card invalid throw exception
            if (matchingCard == null) {
                incrementAndCheckMaxAttempts(request.pspSessionId());
                throw new DataConflictException("Carte invalide");
            }
            // if balance insufficient throw exception
            if (new BigDecimal(matchingCard.get("balance").toString()).compareTo(amount) < 0) {
                incrementAndCheckMaxAttempts(request.pspSessionId());
                throw new DataConflictException("Solde insuffisant");
            }

            // Success remove session
            redisTemplate.delete(PSP_SESSION_PREFIX + request.pspSessionId());
            redisTemplate.delete(PSP_ATTEMPTS_PREFIX + request.pspSessionId());

            // simulate a transaction ID by generating a random string
            return TRANSACTION_ID_PREFIX + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        } catch (java.io.IOException e) {
            log.error("Failed to process mock payment", e);
            throw new RuntimeException("Erreur technique paiement");  
        } 
    }
}
