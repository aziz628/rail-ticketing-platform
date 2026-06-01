package com.sncft.app.ticket;

import com.sncft.app.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType; // 'TICKET' or 'SUBSCRIPTION'

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String type; // 'PAYMENT', 'REFUND' in future

    @Column(name = "psp_transaction_id", unique = true, length = 100)
    private String pspTransactionId;

    @Column(nullable = false, length = 20)
    private String status; // 'SUCCESS', 'FAILED', 'PENDING'

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = java.time.ZonedDateTime.now();
    }
}
