CREATE TABLE trip_generation_settings (
    id INT DEFAULT 1 PRIMARY KEY,
    auto_generate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    generation_span_days INT NOT NULL DEFAULT 7,
    CONSTRAINT single_row_check CHECK (id = 1)
);

CREATE TABLE trip_segment_availability (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    seat_class_id UUID NOT NULL REFERENCES seat_classes(id),
    segment_order INT NOT NULL,
    available_seats INT NOT NULL,
    CONSTRAINT uq_trip_segment_class UNIQUE (trip_id, seat_class_id, segment_order)
);

INSERT INTO trip_generation_settings (id, auto_generate_enabled, generation_span_days) 
SELECT 1, true, 7 WHERE NOT EXISTS (SELECT 1 FROM trip_generation_settings WHERE id = 1);
