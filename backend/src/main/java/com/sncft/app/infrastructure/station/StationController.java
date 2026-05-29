package com.sncft.app.infrastructure.station;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.sncft.app.shared.dto.PaginatedResponse;

import java.util.UUID;

@RestController
@RequestMapping("/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @GetMapping
    public PaginatedResponse<StationResponse> getAllStations(@RequestParam(defaultValue = "0") int page) {
        // fixed payload size of 10
        return stationService.getAllStations(page, 10);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public void createStation(@Valid @RequestBody StationRequest request) {
        stationService.createStation(request);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void updateStation(@PathVariable UUID id, @Valid @RequestBody StationRequest request) {
        stationService.updateStation(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteStation(@PathVariable UUID id) {
        stationService.deleteStation(id);
    }
}
