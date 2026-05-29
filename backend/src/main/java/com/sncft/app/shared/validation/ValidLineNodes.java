package com.sncft.app.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// this interface is a custom validation annotation for line nodes

@Target({ElementType.FIELD, ElementType.PARAMETER}) // where annotation used
@Retention(RetentionPolicy.RUNTIME)                 // annotation be available at runtime
@Constraint(validatedBy = LineNodesValidator.class) // the class that implements the interface validation
public @interface ValidLineNodes {
    String message() default "Invalid line nodes sequence"; 
    Class<?>[] groups() default {};  // group constraints that applied together
    Class<? extends Payload>[] payload() default {}; // attach metadata like severity of the constraint 
}
