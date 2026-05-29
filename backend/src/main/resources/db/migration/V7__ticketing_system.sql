
CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    trip_id UUID NOT NULL REFERENCES trip(id),
    origin_station_id UUID NOT NULL REFERENCES stations(id),
    destination_station_id UUID NOT NULL REFERENCES stations(id),
    seat_class_id UUID NOT NULL REFERENCES seat_classes(id),
    final_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PAID', --  PAID,USED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    target_id UUID NOT NULL, -- ID of the Ticket or Subscription
    target_type VARCHAR(50) NOT NULL, -- 'TICKET' or 'SUBSCRIPTION'
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'PAYMENT', 'REFUND'
    psp_transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- record payment failures and blocking
CREATE TABLE client_restrictions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_blocked BOOLEAN DEFAULT FALSE,
    failed_payment_count INT DEFAULT 0,
    total_lifetime_blocks INT DEFAULT 0
);

