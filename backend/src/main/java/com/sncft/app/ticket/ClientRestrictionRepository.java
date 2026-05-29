package com.sncft.app.ticket;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ClientRestrictionRepository extends JpaRepository<ClientRestriction, UUID> {
    Optional<ClientRestriction> findByUserId(UUID userId);

    @Query("SELECT new com.sncft.app.ticket.AdminBlockedUserResponse(cr.user.id, cr.user.name, cr.totalLifetimeBlocks) " +
           "FROM ClientRestriction cr WHERE cr.totalLifetimeBlocks > 0 ORDER BY cr.totalLifetimeBlocks DESC")
    Page<AdminBlockedUserResponse> findUsersWithBlocks(Pageable pageable);

    @Modifying
    @Transactional
    // where blocked is true or failedPaymentCount > 0
    @Query("UPDATE ClientRestriction cr "
            + "SET cr.blocked = false, cr.failedPaymentCount = 0 "
            + "WHERE cr.blocked = true OR cr.failedPaymentCount > 0")
    void resetAllRestrictions();
    
    Optional<ClientRestriction> findByUserIdAndBlockedTrue(UUID userId);

    Optional<ClientRestriction> findByUserEmail(String email);
}
