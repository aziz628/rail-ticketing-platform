package com.sncft.app.shared.validation;

import com.sncft.app.infrastructure.line.LineNodeRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.List;

// This class implements the validation logic for the custom annotation ValidLineNodes
// It checks if the line nodes are in the correct order and if the first station has 0 km distance

public class LineNodesValidator implements ConstraintValidator<ValidLineNodes, List<LineNodeRequest>> {
    
    @Override
    public boolean isValid(List<LineNodeRequest> nodes, ConstraintValidatorContext context) {
        if (nodes == null || nodes.isEmpty()) {
            return true; // Let @NotEmpty or @Size handle this
        }

        // Check if the first station distance is exactly 0
        if (nodes.get(0).kmFromSource() != 0) {
            context.disableDefaultConstraintViolation(); // disable the default constraint violation message
            context.buildConstraintViolationWithTemplate("La première gare doit avoir une distance de 0 km.") // set the custom constraint violation message
                   .addConstraintViolation();
            return false;
        }

        // Check if distances are strictly increasing and are unique
        double lastDist = -1.0;
        for (LineNodeRequest node : nodes) {
            if (node.kmFromSource() <= lastDist) {
                context.disableDefaultConstraintViolation(); // disable the default constraint violation message
                context.buildConstraintViolationWithTemplate("Les gares doivent être ajoutées dans un ordre strictement croissant de distance.")
                       .addConstraintViolation();
                return false;
            }
            lastDist = node.kmFromSource();
        }

        return true;
    }
}
