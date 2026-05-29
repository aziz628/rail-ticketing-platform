package com.sncft.app.ticket;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TicketPaymentInitiateRequest(
    @NotNull(message = "L'identifiant du voyage est requis")
    UUID tripId,

    @NotNull(message = "La station de départ est requise")
    UUID originLineNodeId,

    @NotNull(message = "La station d'arrivée est requise")
    UUID destinationLineNodeId,

    @NotNull(message = "La classe de voyage est requise")
    UUID seatClassId
) {}
