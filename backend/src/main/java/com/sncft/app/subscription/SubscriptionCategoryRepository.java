package com.sncft.app.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionCategoryRepository extends JpaRepository<SubscriptionCategory, UUID> {
    boolean existsByName(SubscriptionCategoryType name);
    Optional<SubscriptionCategory> findByName(SubscriptionCategoryType name);
}
