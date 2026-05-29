package com.sncft.app.subscription;

import com.sncft.app.psp.PaymentInitiateResponse;
import com.sncft.app.shared.config.AppConstants;
import com.sncft.app.shared.dto.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/{filter}")
    @PreAuthorize("hasRole('VOYAGER')")
    public PaginatedResponse<SubscriptionResponse> getSubscriptions(
            @PathVariable SubscriptionFilter filter, 
            Pageable pageable) {
        Pageable page = PageRequest.of(pageable.getPageNumber(), AppConstants.PAGE_SIZE);
        
        // Map filter to corresponding subscription statuses
        List<SubscriptionStatus> statuses = switch (filter) {
            case CURRENT -> List.of(SubscriptionStatus.AWAITING_PAYMENT, SubscriptionStatus.ACTIVE);
            case EXPIRED -> List.of(SubscriptionStatus.EXPIRED);
        };
        
        return subscriptionService.getSubscriptionsByStatusIn(statuses, page);
    }

    @PostMapping("/{id}/initiate-payment")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('VOYAGER')")
    public PaymentInitiateResponse initiatePayment(@PathVariable UUID id) {
        return subscriptionService.initiatePayment(id);
    }
}
