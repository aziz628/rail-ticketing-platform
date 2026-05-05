package com.sncft.app.staff;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "controller_line")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ControllerLine {

    @Id
    private UUID userId;

    //extract id from user entity and store it
    @OneToOne
    @MapsId 
    @JoinColumn(name = "user_id")
    private User user;// object represents the relationship, db only store id

    @ManyToOne
    @JoinColumn(name = "line_id", nullable = false)
    private Line line;
}
