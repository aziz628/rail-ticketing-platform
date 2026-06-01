ALTER TABLE tickets
    ADD CONSTRAINT uk_tickets_user_id_trip_id UNIQUE (user_id, trip_id);

ALTER TABLE trip_segment_availability
    ADD CONSTRAINT ck_trip_segment_availability_nonnegative
    CHECK (available_seats >= 0);