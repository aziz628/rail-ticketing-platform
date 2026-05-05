CREATE TABLE controller_line (
    user_id UUID PRIMARY KEY,
    line_id UUID NOT NULL,
    CONSTRAINT fk_controller_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_controller_line FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE RESTRICT
);
