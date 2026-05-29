package com.sncft.app.schedule;

import com.sncft.app.shared.validation.ValidSchedule;

import jakarta.validation.Valid;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@ValidSchedule
public record ScheduleCreateRequest(
    @NotNull(message = "L'identifiant de la ligne est requis")
    UUID lineId,

    @NotNull(message = "L'identifiant du train est requis")
    UUID trainId,

    @NotNull(message = "L'identifiant du contrôleur est requis")
    UUID controllerId,

    @Pattern(regexp = "^[01]{7}$", message = "Le masque de jours doit être composé de 7 chiffres")
    String daysBitmask,

    @NotNull(message = "La date d'activation est requise")
    LocalDate activationDate,

    //deactivation date optional , but if send it must be greater than activation date 
    LocalDate deactivationDate,

    // arrival times must be strictly increasing and between 00:00 and 23:59
    @NotEmpty(message = "La liste des arrêts ne peut pas être vide")
    @Valid
    List<ScheduleStopRequest> stops
) {
    public record ScheduleStopRequest(
        @NotNull(message = "L'identifiant du point de passage est requis")
        UUID lineNodeId,

        @NotNull(message = "L'heure d'arrivée est requise")
        LocalTime arrivalTime
    ) {}
}

