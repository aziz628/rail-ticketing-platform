package com.sncft.app.subscription;

import com.sncft.app.shared.config.AppConstants;
import com.sncft.app.shared.dto.PaginatedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/subscription-requests")
@RequiredArgsConstructor
public class SubscriptionRequestController {

    private final SubscriptionRequestService requestService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)// consume role is 
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('VOYAGER')")
    public void createSubscriptionRequest(@Valid @ModelAttribute SubscriptionRequestForm form) {
        requestService.createSubscriptionRequest(form);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('VOYAGER')")
    public PaginatedResponse<SubscriptionRequestResponse> getMyRequests(Pageable pageable) {
        Pageable page = PageRequest.of(pageable.getPageNumber(), AppConstants.PAGE_SIZE);
        return requestService.getMyRequests(page);
    }
}
