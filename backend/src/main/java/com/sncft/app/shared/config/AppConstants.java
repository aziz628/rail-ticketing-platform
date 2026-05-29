package com.sncft.app.shared.config;

import java.time.Duration;

public final class AppConstants {
    private AppConstants() {}

    public static final int PAGE_SIZE = 10;

    // Booking & Pricing
    public static final double PRICE_PER_KM = 0.05;
    public static final int BOOKING_DEADLINE_MINUTES = 15;
    public static final Duration LOCK_DURATION = java.time.Duration.ofMinutes(10);

    // Redis Key Prefixes
    public static final String USER_LOCK_KEY_PREFIX = "lock:user:";
    public static final String SEGMENT_LOCK_KEY_PREFIX = "lock:segment:";
    public static final String BOOKING_CONTEXT_KEY_PREFIX = "booking:session:";
    public static final String SUBSCRIPTION_CONTEXT_KEY_PREFIX = "subscription:session:";
    public static final String SHADOW_SESSION_KEY_PREFIX = "shadow:session:";
    public static final String PSP_SESSION_PREFIX = "psp:session:";
    // Transaction Types
    public static final String TRANSACTION_TARGET_TICKET = "TICKET";
    public static final String TRANSACTION_TARGET_SUBSCRIPTION = "SUBSCRIPTION";
    public static final String TRANSACTION_TYPE_PAYMENT = "PAYMENT";
    public static final String TRANSACTION_STATUS_SUCCESS = "SUCCESS";
}
