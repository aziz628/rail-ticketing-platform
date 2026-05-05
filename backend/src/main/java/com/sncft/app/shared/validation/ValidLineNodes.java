package com.sncft.app.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// this inteface is a custom validation annotation for line nodes

@Target({ElementType.FIELD, ElementType.PARAMETER}) // specify where the annotation can be used
@Retention(RetentionPolicy.RUNTIME) // the annotation will be available at runtime
@Constraint(validatedBy = LineNodesValidator.class) // specify the validator class that implements the validation logic
public @interface ValidLineNodes {
    String message() default "Invalid line nodes sequence"; // default message to be displayed if validation fails
    Class<?>[] groups() default {}; // used to group constraints that should be applied together
    Class<? extends Payload>[] payload() default {}; // used to attach metadata to the constraint for specific validation scenarios 
}
