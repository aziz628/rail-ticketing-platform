package com.sncft.app.shared.setup;

import com.sncft.app.subscription.SubscriptionCategory;
import com.sncft.app.subscription.SubscriptionCategoryRepository;
import com.sncft.app.subscription.SubscriptionCategoryType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(6)
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class SubscriptionCategorySeeder implements CommandLineRunner {

    private final SubscriptionCategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        // check if any sub category exist at all
        if(categoryRepository.count() > 0){
            log.info("Subscription Category already exists");
            return;
        }
        seedCategory(SubscriptionCategoryType.SCOLAIRE, 15.00, 40.00);
        seedCategory(SubscriptionCategoryType.UNIVERSITAIRE, 20.00, 50.00);
        seedCategory(SubscriptionCategoryType.PROFESSIONNEL, 30.00, 80.00);
        seedCategory(SubscriptionCategoryType.CIVIL, 50.00, 135.00);
    }

    private void seedCategory(SubscriptionCategoryType name, double monthly, double quarterly) {

        SubscriptionCategory category = SubscriptionCategory.builder()
                .name(name)
                .monthlyPrice(BigDecimal.valueOf(monthly))
                .quarterlyPrice(BigDecimal.valueOf(quarterly))
                .build();

        categoryRepository.save(category);
        log.info("Subscription Category seeded: {}", name);
    }
}
