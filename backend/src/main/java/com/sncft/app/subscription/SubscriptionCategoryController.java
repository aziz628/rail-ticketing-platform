package com.sncft.app.subscription;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/subscription-categories")
@RequiredArgsConstructor
public class SubscriptionCategoryController {

    private final SubscriptionCategoryService categoryService;

    @GetMapping
    public List<SubscriptionCategoryResponse> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void patchCategory(@PathVariable UUID id, @Valid @RequestBody SubscriptionCategoryPatchRequest request) {
        categoryService.patchCategory(id, request);
    }
}
