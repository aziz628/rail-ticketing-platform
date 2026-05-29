package com.sncft.app.subscription;

import com.sncft.app.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionCategoryService {

    private final SubscriptionCategoryRepository categoryRepository;
    private final SubscriptionCategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public List<SubscriptionCategoryResponse> getAllCategories() {
        return categoryRepository.findAll(Sort.by("name"))
                .stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void patchCategory(UUID id, SubscriptionCategoryPatchRequest request) {
        SubscriptionCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie d'abonnement non trouvée"));

        category.setMonthlyPrice(request.monthlyPrice());
        category.setQuarterlyPrice(request.quarterlyPrice());

        categoryRepository.save(category);
    }
}
