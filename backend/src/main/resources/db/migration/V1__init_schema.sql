-- Sprint 1 base schema: auth users only.
-- This migration is cross-compatible with H2 (tests) and PostgreSQL (production).

CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    national_id_type VARCHAR(30),
    national_id_number VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_national_id UNIQUE (national_id_number)
);
