package com.sncft.app.infrastructure.line;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

@RestController
@RequestMapping("/lines")
@RequiredArgsConstructor
public class LineController {

    private final LineService lineService;

    @GetMapping
    public PaginatedResponse<LineResponse> getAllLines(@RequestParam(defaultValue = "0") int page) {
        return lineService.getAllLines(page, AppConstants.PAGE_SIZE);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public void createLine(@Valid @RequestBody LineRequest request) {
        lineService.createLine(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteLine(@PathVariable UUID id) {
        lineService.deleteLine(id);
    }
}
