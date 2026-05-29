package com.sncft.app.subscription;

import com.sncft.app.shared.config.AppConstants;
import com.sncft.app.shared.dto.PaginatedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/staff/subscription-requests")
@RequiredArgsConstructor
public class SubscriptionStaffController {

    private final SubscriptionRequestService requestService;

    @GetMapping("/{status}")
    @PreAuthorize("hasRole('AGENT')")
    @ResponseStatus(HttpStatus.OK)
    public PaginatedResponse<StaffSubscriptionRequestResponse> getRequests(
            @PathVariable SubscriptionRequestStatus status,
            Pageable pageable) {
        Pageable page = PageRequest.of(pageable.getPageNumber(), AppConstants.PAGE_SIZE);
        return requestService.getRequestsByStatus(status, page);
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('AGENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approveRequest(@PathVariable UUID id) {
        requestService.approveRequest(id);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('AGENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectRequest(
            @PathVariable UUID id,
            @Valid @RequestBody SubscriptionRejectRequest rejectRequest) {
        requestService.rejectRequest(id, rejectRequest.rejectReason());
    }

    @GetMapping("/{requestId}/proof")
    @PreAuthorize("hasAnyRole('AGENT')")
    public ResponseEntity<Resource> getProofFile(@PathVariable UUID requestId) {
        Resource resource = requestService.getProofFile(requestId);
        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
