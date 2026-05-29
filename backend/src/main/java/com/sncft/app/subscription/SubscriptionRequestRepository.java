package com.sncft.app.subscription;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRequestRepository extends JpaRepository<SubscriptionRequest, UUID> {

    Optional<SubscriptionRequest> findByIdAndAgentId(UUID id, UUID agentId);

    boolean existsByUserIdAndLineIdAndStatus(UUID userId, UUID lineId, SubscriptionRequestStatus status);

    long countByAgentIdAndStatus(UUID agentId, SubscriptionRequestStatus status);

    Page<SubscriptionRequest> findByUserId(UUID userId, Pageable pageable);

    List<SubscriptionRequest> findByAgentIdAndStatus(UUID agentId, SubscriptionRequestStatus status);

    Page<SubscriptionRequest> findByAgentIdAndStatus(UUID agentId, SubscriptionRequestStatus status, Pageable pageable);

    Page<SubscriptionRequest> findByAgentIdAndStatusNot(UUID agentId, SubscriptionRequestStatus status, Pageable pageable);
}
