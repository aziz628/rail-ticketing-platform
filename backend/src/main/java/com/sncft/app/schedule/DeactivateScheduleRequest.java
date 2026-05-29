package com.sncft.app.schedule;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record DeactivateScheduleRequest(
    @NotNull(message = "La date de désactivation est obligatoire")
    LocalDate deactivationDate
) {}
