package com.sncft.app.schedule;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

import com.sncft.app.shared.config.AppConstants;
import com.sncft.app.shared.dto.PaginatedResponse;

import java.util.UUID;

// enum of active and unactive 

@RestController
@RequestMapping("/schedules")
@RequiredArgsConstructor
public class TripScheduleController {

    private final TripScheduleService scheduleService;

    @GetMapping("/{status}")
    public PaginatedResponse<ScheduleResponse> getSchedules(
            @PathVariable ScheduleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) UUID lineId) {
        
        PageRequest pageRequest = PageRequest.of(page, AppConstants.PAGE_SIZE);

        if (status == ScheduleStatus.INACTIVE) {
            return scheduleService.getInactiveSchedules(lineId, pageRequest);
        }
        return scheduleService.getActiveSchedules(lineId, pageRequest);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public void createSchedule(@Valid @RequestBody ScheduleCreateRequest request) {
        scheduleService.createSchedule(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteSchedule(@PathVariable UUID id) {
        scheduleService.deleteSchedule(id);
    }

    @PatchMapping("/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivateSchedule(@PathVariable UUID id, @Valid @RequestBody DeactivateScheduleRequest request) {
        scheduleService.deactivateSchedule(id, request.deactivationDate());
    }
    
    @PatchMapping("/{id}/controller")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void reassignController(@PathVariable UUID id, @RequestBody ControllerReassignRequest request) {
        scheduleService.reassignController(id, request.controllerId());
    }
}
