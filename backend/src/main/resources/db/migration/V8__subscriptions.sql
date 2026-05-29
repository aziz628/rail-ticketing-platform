CREATE TABLE subscription_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    monthly_price DECIMAL(10, 2) NOT NULL,
    quarterly_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE subscription_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES subscription_categories(id) ON DELETE RESTRICT,
    agent_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    reject_reason VARCHAR(255),
    duration VARCHAR(50) NOT NULL, -- 'MONTHLY', 'QUARTERLY'
    proof_filename VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES subscription_requests(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    expire_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'AWAITING_PAYMENT' -- 'AWAITING_PAYMENT', 'ACTIVE', 'EXPIRED'
);


-- Add subscription_id column and foreign key constraint for tickets referencing subscriptions
ALTER TABLE tickets ADD COLUMN subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;

