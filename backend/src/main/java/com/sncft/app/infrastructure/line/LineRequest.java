package com.sncft.app.infrastructure.line;

import com.sncft.app.shared.validation.ValidLineNodes;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record LineRequest(
    @NotBlank(message = "Le nom de la ligne est obligatoire")
    String name,
    @NotEmpty(message = "Au moins deux gares sont nécessaires pour former une ligne")
    @Size(min = 2, message = "Une ligne doit avoir au moins une gare de départ et une gare d'arrivée")
    @Valid
    @ValidLineNodes
    List<LineNodeRequest> nodes,
    boolean createReverse
) {}
