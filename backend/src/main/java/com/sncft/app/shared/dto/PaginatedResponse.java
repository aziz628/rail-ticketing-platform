package com.sncft.app.shared.dto;

import java.util.List;
import org.springframework.data.domain.Page;

/** 
 * A generic record that represents a paginated response.
 * It contains a list of items of type T and a boolean indicating whether it is the last page.
 */
public record PaginatedResponse<T>(
    List<T> content,
    boolean last
) {
    public static <T> PaginatedResponse<T> of(Page<?> page, List<T> mappedContent) {
        return new PaginatedResponse<>(
            mappedContent,
            page.isLast()
        );
    }
}
