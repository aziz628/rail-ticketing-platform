package com.sncft.app.subscription;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineRepository;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.shared.service.FileStorageService;
import com.sncft.app.user.NationalIdType;
import com.sncft.app.user.User;
import com.sncft.app.user.UserRepository;
import com.sncft.app.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;



import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;



@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionRequestService {

    private final SubscriptionRequestRepository requestRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionCategoryRepository categoryRepository;
    private final LineRepository lineRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final SubscriptionRequestMapper requestMapper;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    @Transactional
    public void createSubscriptionRequest(SubscriptionRequestForm form) {
        User user = getCurrentUser();

        // Verify Category exists
        SubscriptionCategory category = categoryRepository.findByName(form.getCategoryName())
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie de souscription non trouvée"));

        boolean hasProof = form.getProofFile() != null && !form.getProofFile().isEmpty();

        // Validate Category-specific rules (ID type mismatch rules and proof requirement)
        validateEligibility(user, category.getName(), hasProof);

        // Verify Line exists
        Line line = lineRepository.findById(form.getLineId())
                .orElseThrow(() -> new ResourceNotFoundException("Ligne non trouvée"));

        // Verify no pending request for this user and line
        boolean hasPendingRequest = requestRepository.existsByUserIdAndLineIdAndStatus(
                user.getId(), form.getLineId(), SubscriptionRequestStatus.PENDING);
        if (hasPendingRequest) {
            throw new DataConflictException("demande déjà existe pour cette ligne");
        }

        // Verify no active/awaiting payment subscription for this user and line
        boolean hasActiveOrAwaitingPaymentSub = subscriptionRepository.existsByUserIdAndLineIdAndStatusIn(
                user.getId(), form.getLineId(), List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.AWAITING_PAYMENT));
        if (hasActiveOrAwaitingPaymentSub) {
            throw new DataConflictException("abonnement déjà existe pour cette ligne");
        }

        // store proof file if provided
        String proofFilename = null;
        if (hasProof) {
            proofFilename = fileStorageService.storeFile(form.getProofFile());
        }

        // Auto-approve Civil requests, review others
        boolean isCivil = (category.getName() == SubscriptionCategoryType.CIVIL);
        SubscriptionRequestStatus initialStatus = isCivil ? SubscriptionRequestStatus.APPROVED : SubscriptionRequestStatus.PENDING;
        
        User assignedAgent = null;
        // For non-civil categories, assign to the agent with the least pending requests
        if (!isCivil) {
            // Find Agent with lowest PENDING requests count
            List<User> activeAgents = userRepository.findByRoleAndIsDeletedFalse(UserRole.AGENT);
            if (activeAgents.isEmpty()) {
                throw new IllegalArgumentException("Aucun agent actif n'est disponible pour traiter votre demande");
            }

            long minPendingCount = Long.MAX_VALUE;
            for (User agent : activeAgents) {
                // find the count of pending requests for this agent
                long pendingCount = requestRepository.countByAgentIdAndStatus(agent.getId(), SubscriptionRequestStatus.PENDING);
                // set the agent if it has the least pending requests
                if (pendingCount < minPendingCount) {
                    minPendingCount = pendingCount;
                    assignedAgent = agent;
                }
            }
        }

        SubscriptionRequest request = SubscriptionRequest.builder()
                .user(user)
                .line(line)
                .category(category)
                .agent(assignedAgent)
                .duration(form.getDuration())
                .proofFilename(proofFilename)
                .status(initialStatus)
                .build();

        requestRepository.save(request);

        // Instantly generate the subscription awaiting payment if auto-approved
        if (isCivil) {
            Subscription subscription = Subscription.builder()
                    .request(request)
                    .user(user)
                    .status(SubscriptionStatus.AWAITING_PAYMENT) // Voyager can directly proceed to payment
                    .build();
            subscriptionRepository.save(subscription);
        }
    }

    private void validateEligibility(User user, SubscriptionCategoryType categoryType, boolean hasProof) {
        NationalIdType idType = user.getNationalIdType();

        switch (categoryType) {
            case SCOLAIRE:
                if (idType != NationalIdType.BIRTH_CERT) {
                    // not allowed to apply for Scolaire
                    throw new IllegalArgumentException("pas autorisé à postuler pour cette catégorie");
                }
                if (!hasProof) {
                    throw new IllegalArgumentException("Le document justificatif est requis pour cette catégorie.");
                }
                break;

            case UNIVERSITAIRE:
                if (idType != NationalIdType.CIN) {
                    throw new IllegalArgumentException("pas autorisé à postuler pour cette catégorie");
                }
                if (!hasProof) {
                    throw new IllegalArgumentException("Le document justificatif est requis pour cette catégorie.");
                }
                break;

            case PROFESSIONNEL:
                if (idType != NationalIdType.CIN) {
                    throw new IllegalArgumentException("pas autorisé à postuler pour cette catégorie");
                }
                if (!hasProof) {
                    throw new IllegalArgumentException("Le document justificatif est requis pour cette catégorie.");
                }
                break;

            case CIVIL:
                if (idType != NationalIdType.CIN) {
                    throw new IllegalArgumentException("La catégorie Civile nécessite une carte d'identité (CIN).");
                }
                break;
        }
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<SubscriptionRequestResponse> getMyRequests(Pageable pageable) {
        User user = getCurrentUser();
        Page<SubscriptionRequest> pageResult = requestRepository.findByUserId(user.getId(), pageable);
        
        List<SubscriptionRequestResponse> content = pageResult.getContent().stream()
                .map(requestMapper::toResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.of(pageResult, content);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<StaffSubscriptionRequestResponse> getRequestsByStatus(SubscriptionRequestStatus status, Pageable pageable) {
        User agent = getCurrentUser();
        Page<SubscriptionRequest> pageResult = requestRepository.findByAgentIdAndStatus(
                agent.getId(), status, pageable);

        List<StaffSubscriptionRequestResponse> content = pageResult.getContent().stream()
                .map(requestMapper::toStaffResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.of(pageResult, content);
    }

    @Transactional
    public void approveRequest(UUID id) {
        User agent = getCurrentUser();
        // Ensure the agent is assigned to this request and it's pending
        SubscriptionRequest request = requestRepository.findByIdAndAgentId(id, agent.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Demande de souscription non trouvée"));

        if (request.getStatus() != SubscriptionRequestStatus.PENDING) {
            throw new IllegalArgumentException("Cette demande a déjà été traitée");
        }
        // Update request status to APPROVED
        request.setStatus(SubscriptionRequestStatus.APPROVED);
        requestRepository.save(request);
        
        // Create subscription in AWAITING_PAYMENT status
        Subscription subscription = Subscription.builder()
                .request(request)
                .user(request.getUser())
                .status(SubscriptionStatus.AWAITING_PAYMENT)
                .build();
        subscriptionRepository.save(subscription);
    }

    @Transactional
    public void rejectRequest(UUID id, String rejectReason) {
        User agent = getCurrentUser();
        if (rejectReason == null || rejectReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Le motif du rejet est requis");
        }

        SubscriptionRequest request = requestRepository.findByIdAndAgentId(id, agent.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Demande de souscription non trouvée"));

        if (request.getStatus() != SubscriptionRequestStatus.PENDING) {
            throw new IllegalArgumentException("Cette demande a déjà été traitée");
        }

        request.setStatus(SubscriptionRequestStatus.REJECTED);
        request.setRejectReason(rejectReason);
        requestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public Resource getProofFile(UUID requestId) {
        SubscriptionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande de souscription non trouvée"));

        if (request.getProofFilename() == null || request.getProofFilename().isEmpty()) {
            throw new ResourceNotFoundException("Aucun document justificatif pour cette demande");
        }

        return fileStorageService.loadFileAsResource(request.getProofFilename());
    }
}
