package com.sncft.app.staff;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ControllerLineRepository extends JpaRepository<ControllerLine, UUID> {
    
    @Query("SELECT cl FROM ControllerLine cl JOIN FETCH cl.user JOIN FETCH cl.line WHERE cl.user.isDeleted = false")
    Page<ControllerLine> findAllActiveWithUserAndLine(Pageable pageable);

    Optional<ControllerLine> findByUserId(UUID userId);
}
