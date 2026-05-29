package com.sncft.app.ticket;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.config.AppConstants;
import com.sncft.app.psp.PaymentInitiateResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('VOYAGER')")
    public ResponseEntity<byte[]> downloadTicket(@PathVariable UUID id) {
        byte[] pdf = ticketService.downloadTicket(id);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=billet-sncft-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
    
    @PostMapping("/initiate-payment")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('VOYAGER')")
    public PaymentInitiateResponse initiatePurchase(
            @Valid @RequestBody TicketPaymentInitiateRequest request) {
        return ticketService.initiatePayment(request);
    }

    @PostMapping("/book-free")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('VOYAGER')")
    public TicketResponse bookFree(
            @Valid @RequestBody TicketPaymentInitiateRequest request) {
        return ticketService.bookFree(request);
    }

    @GetMapping("/{filter}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('VOYAGER')")
    public PaginatedResponse<TicketResponse> getTickets(
            @PathVariable TicketFilter filter,
            Pageable pageable) {
        Pageable page = PageRequest.of(pageable.getPageNumber(), AppConstants.PAGE_SIZE);
        // return the ticket based on the filter
        if (filter == TicketFilter.PAST) {
            return ticketService.getPastTickets(page);
        }
        return ticketService.getUpcomingTickets(page);
    }
}
