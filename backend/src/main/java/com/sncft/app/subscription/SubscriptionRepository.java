package com.sncft.app.subscription;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.UUID;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    @Query("SELECT COUNT(s) > 0 FROM Subscription s " +
           "WHERE s.user.id = :userId " +
           "AND s.request.line.id = :lineId " +
           "AND s.status IN :statuses")
    boolean existsByUserIdAndLineIdAndStatusIn(
            @Param("userId") UUID userId,
            @Param("lineId") UUID lineId,
            @Param("statuses") Collection<SubscriptionStatus> statuses);

    @Query("SELECT s FROM Subscription s " +
           "WHERE s.user.id = :userId " +
           "AND s.request.line.id = :lineId " +
           "AND s.status = com.sncft.app.subscription.SubscriptionStatus.ACTIVE")
    Optional<Subscription> findActiveByUserIdAndLineId(
            @Param("userId") UUID userId,
            @Param("lineId") UUID lineId);

    @Modifying
    @Query("UPDATE Subscription s SET s.status = com.sncft.app.subscription.SubscriptionStatus.EXPIRED " +
           "WHERE s.status = com.sncft.app.subscription.SubscriptionStatus.ACTIVE " +
           "AND s.expireDate < :today")
    int updateExpiredSubscriptions(@Param("today") LocalDate today);

    Page<Subscription> findByUserId(UUID userId, Pageable pageable);

    Page<Subscription> findByUserIdAndStatusIn(UUID userId, Collection<SubscriptionStatus> statuses, Pageable pageable);

    Optional<Subscription> findByRequestId(UUID requestId);

    // check if user have active sub for line 
    @Query("SELECT COUNT(s) > 0 FROM Subscription s " +
            "WHERE s.user.id = :userId " +
            "AND s.request.line.id = :lineId " +
            "AND s.status = :status")
    boolean existsByUserIdAndLineIdAndStatus(@Param("userId") UUID userId, @Param("lineId") UUID lineId, SubscriptionStatus status);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = com.sncft.app.subscription.SubscriptionStatus.ACTIVE")
    long countActiveSubscriptions();
}
