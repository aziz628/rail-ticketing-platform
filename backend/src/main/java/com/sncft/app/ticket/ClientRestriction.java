package com.sncft.app.ticket;

import com.sncft.app.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "client_restrictions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientRestriction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "is_blocked")
    @Builder.Default
    private boolean blocked = false;

    @Column(name = "failed_payment_count")
    @Builder.Default
    private int failedPaymentCount = 0;

    @Column(name = "total_lifetime_blocks")
    @Builder.Default
    private int totalLifetimeBlocks = 0;
}
