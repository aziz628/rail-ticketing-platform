package com.sncft.app.staff;

import com.sncft.app.shared.config.AppConstants;
import com.sncft.app.shared.dto.PaginatedResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    // Agents

    @GetMapping("/agents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<AgentResponse>> getAgents(
            @RequestParam(defaultValue = "0") int page
    ) {
        return ResponseEntity.ok(staffService.getAgents(page, AppConstants.PAGE_SIZE));
    }

    @PostMapping("/agents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> createAgent(@Valid @RequestBody CreateAgentRequest request) {
        staffService.createAgent(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/agents/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateAgent(@PathVariable UUID id) {
        staffService.deactivateStaff(id);
        return ResponseEntity.ok().build();
    }

    // Controllers

    @GetMapping("/controllers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<ControllerResponse>> getControllers(
            @RequestParam(defaultValue = "0") int page
    ) {
        return ResponseEntity.ok(staffService.getControllers(page, AppConstants.PAGE_SIZE));
    }

    @PostMapping("/controllers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> createController(@Valid @RequestBody CreateControllerRequest request) {
        staffService.createController(request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/controllers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateController(@PathVariable UUID id) {
        staffService.deactivateStaff(id);
        return ResponseEntity.ok().build();
    }
}
