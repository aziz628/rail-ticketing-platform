package com.sncft.app.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM "
            + "Transaction t "
            + "WHERE t.status = 'SUCCESS' "
            + "AND t.type = 'PAYMENT' ")
    BigDecimal calculateTotalRevenue();
}
