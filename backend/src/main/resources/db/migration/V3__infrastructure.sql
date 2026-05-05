CREATE TABLE stations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE train_types (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    base_price_increase_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE seat_classes (
    id UUID PRIMARY KEY,
    train_id UUID NOT NULL REFERENCES train_types(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    price_increase_percentage DECIMAL(5,2) NOT NULL,
    CONSTRAINT uk_train_seat_type UNIQUE (train_id, type)
);

CREATE TABLE lines (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE line_nodes (
    id UUID PRIMARY KEY,
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES stations(id),
    km_from_source DOUBLE PRECISION NOT NULL,
    order_index INT NOT NULL,
    CONSTRAINT uk_line_station UNIQUE (line_id, station_id),
    CONSTRAINT uk_line_order UNIQUE (line_id, order_index)
);
