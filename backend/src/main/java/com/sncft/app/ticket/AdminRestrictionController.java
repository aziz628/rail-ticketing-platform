package com.sncft.app.ticket;

import com.sncft.app.shared.dto.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/restrictions")
@RequiredArgsConstructor
public class AdminRestrictionController {

    private final TicketService ticketService;

    @GetMapping("/blocked")
    @PreAuthorize("hasRole('ADMIN')")
    public PaginatedResponse<AdminBlockedUserResponse> getBlockedUsers(Pageable pageable) {
        return ticketService.getBlockedUsers(PageRequest.of(pageable.getPageNumber(), 10)); // Assuming default size
    }
}
