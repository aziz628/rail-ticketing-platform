package com.sncft.app.shared.validation;

import com.sncft.app.schedule.ScheduleCreateRequest;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;
import java.time.LocalTime;

// implement constraint validator for schedule create request

public class ScheduleValidator implements ConstraintValidator<ValidSchedule, ScheduleCreateRequest> {

    @Override
    public boolean isValid(ScheduleCreateRequest request, ConstraintValidatorContext context) {
        boolean valid = true;

        // Activation date cannot be in the past
        if (request.activationDate().isBefore(LocalDate.now())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("La date d'activation ne peut pas être dans le passé.")
                   .addPropertyNode("activationDate")
                   .addConstraintViolation();
            valid = false;
        }

        // If deactivationDate is provided: must be after activationDate AND lifespan >= 7 days
        if (request.deactivationDate() != null) {
            if (!request.deactivationDate().isAfter(request.activationDate())) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("La date de désactivation doit être après la date d'activation.")
                       .addPropertyNode("deactivationDate")
                       .addConstraintViolation();
                valid = false;
            } else if (request.deactivationDate().isBefore(request.activationDate().plusDays(6))) {
                // lifespan must be at least 7 days to guarantee at least one full week cycle (avoid broken schedules bitmask)
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate("La durée de l'horaire doit être d'au moins 7 jours.")
                       .addPropertyNode("deactivationDate")
                       .addConstraintViolation();
                valid = false;
            }
        }

        // Stop arrival times must be strictly increasing
        if (request.stops() != null && !request.stops().isEmpty()) {
            LocalTime lastTime = null;
            for (int i = 0; i < request.stops().size(); i++) {
                // get node arrival time
                LocalTime currentTime = request.stops().get(i).arrivalTime();
                
                // fail if arrival time is before/equal to previous node arrival time
                if (lastTime != null && !currentTime.isAfter(lastTime)) {
                    // disable default constraint violation message to avoid duplication
                    context.disableDefaultConstraintViolation();

                    // build constraint violation with custom message on the stops list
                    context.buildConstraintViolationWithTemplate("temps des arrêts doit être strictement croissantes.")
                           .addPropertyNode("stops")
                           .addConstraintViolation();

                    // set the validity to false      
                    valid = false;
                    break;
                }
                lastTime = currentTime;
            }
        }

        return valid;
    }
}
