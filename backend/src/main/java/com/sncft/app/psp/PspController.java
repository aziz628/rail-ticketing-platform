package com.sncft.app.psp;

import com.sncft.app.shared.exception.MaxAttemptsReachedException;
import com.sncft.app.ticket.TicketService;
import com.sncft.app.subscription.SubscriptionService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.UUID;


@RestController
@RequestMapping("/mock-psp")
@RequiredArgsConstructor
public class PspController {

    private final PspService pspService;
    private final TicketService ticketService;
    private final SubscriptionService subscriptionService;

    @GetMapping("/session/{id}")
    @ResponseStatus(HttpStatus.OK)
    public PspSessionResponse getSession(@PathVariable UUID id) {
        return pspService.getSession(id);
    }

    @PostMapping("/pay/{targetType}")
    @ResponseStatus(HttpStatus.OK)
    public void pay(
            @PathVariable PaymentTargetType targetType,
            @Valid @RequestBody PspPayRequest request) {
        try {
            // Process payment through mock PSP service
            String pspTransactionId = pspService.processPayment(request); 
            
            // on success finalize in the appropriate domain service
            handleSuccess(targetType, request.pspSessionId(), pspTransactionId);
        } catch (MaxAttemptsReachedException e) {
            // on failure handle failure callback
            handleFailure(targetType, request.pspSessionId());
            throw e;
        }
    }

    private void handleSuccess(PaymentTargetType targetType, UUID pspSessionId, String pspTransactionId) {
        switch (targetType) {
            case TICKET -> ticketService.finalizePayment(pspSessionId, pspTransactionId);
            case SUBSCRIPTION -> subscriptionService.finalizePayment(pspSessionId, pspTransactionId);
            default -> throw new IllegalArgumentException("Unknown target type: " + targetType);
        }
    }

    private void handleFailure(PaymentTargetType targetType, UUID pspSessionId) {
        switch (targetType) {
            case TICKET -> ticketService.handlePaymentFailure(pspSessionId);
            case SUBSCRIPTION -> subscriptionService.handlePaymentFailure(pspSessionId);
            default -> throw new IllegalArgumentException("Unknown target type: " + targetType);
        }
    }
}
