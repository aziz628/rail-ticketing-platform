package com.sncft.app.trip;

import com.sncft.app.shared.config.AppConstants;
import com.sncft.app.shared.dto.PaginatedResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import java.time.LocalDate;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;
    private final TripMapper tripMapper;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PaginatedResponse<TripResponse> getTrips(
            @RequestParam(required = false) UUID lineId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, // YYYY-MM-DD format
            Pageable pageable) {
        Pageable page = PageRequest.of(pageable.getPageNumber(), AppConstants.PAGE_SIZE);
        return tripService.getTrips(lineId, date, page);
    }

    @GetMapping("/search")
    public PaginatedResponse<TripSearchResponse> searchTrips(
            @RequestParam UUID originId,
            @RequestParam UUID destinationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Pageable pageable) {

        Pageable page = PageRequest.of(pageable.getPageNumber(), AppConstants.PAGE_SIZE);
        return tripService.searchTrips(originId, destinationId, date, page);
    }

    @PostMapping("/sync")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public void manualSync() {
        TripGenerationSettings settings = tripService.getSettings();
        tripService.syncUpcomingTrips(settings.getGenerationSpanDays());
    }

    @GetMapping("/settings")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public TripGenerationSettingsResponse getSettings() {
        return tripMapper.toResponse(tripService.getSettings());
    }

    @PutMapping("/settings")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void updateSettings(@jakarta.validation.Valid @RequestBody TripGenerationSettingsRequest request) {
        tripService.updateSettings(request);
    }

    @GetMapping("/{id}/booking-details")
    @ResponseStatus(HttpStatus.OK)
    public BookingDetailsResponse getBookingDetails(
            @PathVariable UUID id,
            @RequestParam UUID originId,
            @RequestParam UUID destinationId) {
        return tripService.getBookingDetails(id, originId, destinationId);
    }
}
