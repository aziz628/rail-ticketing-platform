package com.sncft.app.infrastructure.train;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.sncft.app.shared.dto.PaginatedResponse;

import java.util.UUID;

@RestController
@RequestMapping("/trains")
@RequiredArgsConstructor
public class TrainController {

    private final TrainService trainService;

    @GetMapping
    public PaginatedResponse<TrainResponse> getAllTrains(@RequestParam(defaultValue = "0") int page) {
        return trainService.getAllTrains(page, 10);
    }

    @GetMapping("/{id}")
    public TrainResponse getTrainById(@PathVariable UUID id) {
        return trainService.getTrainById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public void createTrain(@Valid @RequestBody TrainRequest request) {
        trainService.createTrain(request);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void updateTrain(@PathVariable UUID id, @Valid @RequestBody TrainPatchRequest request) {
        trainService.updateTrain(id, request);
    }

    @PatchMapping("/{id}/seat-classes/{classId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void updateSeatClassPrice(
            @PathVariable UUID id, 
            @PathVariable UUID classId, 
            @Valid @RequestBody SeatClassPatchRequest request) {
        trainService.updateSeatClassPrice(id, classId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteTrain(@PathVariable UUID id) {
        trainService.deleteTrain(id);
    }
}
