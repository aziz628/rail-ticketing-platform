CREATE TABLE trip_schedule (
    id UUID PRIMARY KEY,
    line_id UUID NOT NULL REFERENCES lines(id),
    train_id UUID NOT NULL REFERENCES train_types(id),
    controller_id UUID NOT NULL REFERENCES users(id),
    days_bitmask VARCHAR(7) NOT NULL,
    activation_date DATE NOT NULL,
    deactivation_date DATE
);

CREATE TABLE trip_stops (
    id UUID PRIMARY KEY,
    trip_schedule_id UUID NOT NULL REFERENCES trip_schedule(id) ON DELETE CASCADE,
    line_node_id UUID NOT NULL REFERENCES line_nodes(id),
    arrival_time TIME NOT NULL
);

CREATE TABLE trip (
    id UUID PRIMARY KEY,
    trip_schedule_id UUID NOT NULL REFERENCES trip_schedule(id),
    date DATE NOT NULL,
    ticket_count INT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_trip_schedule_date UNIQUE (trip_schedule_id, date)
);
