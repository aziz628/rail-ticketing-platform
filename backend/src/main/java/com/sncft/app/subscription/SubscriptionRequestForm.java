package com.sncft.app.subscription;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequestForm {

    @NotNull(message = "La catégorie est requise")
    private SubscriptionCategoryType categoryName;

    @NotNull(message = "La ligne est requise")
    private UUID lineId;

    @NotNull(message = "La durée est requise")
    private SubscriptionDuration duration;

    private MultipartFile proofFile;
}