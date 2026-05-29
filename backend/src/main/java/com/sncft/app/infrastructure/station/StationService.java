package com.sncft.app.infrastructure.station;

import com.sncft.app.infrastructure.line.LineNodeRepository;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.DuplicateResourceException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.ticket.TicketRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StationService {

    private final StationRepository stationRepository;
    private final LineNodeRepository lineNodeRepository;
    private final TicketRepository ticketRepository;
    private final StationMapper stationMapper;

    @Transactional(readOnly = true)
    public PaginatedResponse<StationResponse> getAllStations(int page, int size) {
        Page<StationResponse> pageResult = stationRepository.findAllWithDeleteFlag(PageRequest.of(page, size));
        
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication() != null && 
                SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            List<StationResponse> cleaned = pageResult.getContent().stream()
                    .map(s -> new StationResponse(s.id(), s.name(), null))
                    .collect(Collectors.toList());
            return PaginatedResponse.of(pageResult, cleaned);
        }
        
        return PaginatedResponse.of(pageResult, pageResult.getContent());
    }

    @Transactional
    public void createStation(StationRequest request) {
        if (stationRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Le nom de la gare existe déjà");
        }
        Station station = stationMapper.toEntity(request);
        stationRepository.save(station);
    }

    @Transactional
    public void updateStation(UUID id, StationRequest request) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gare non trouvée"));
        
        // check if station name already exists 
        if (!station.getName().equalsIgnoreCase(request.name()) && 
            stationRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Le nom de la gare existe déjà");
        }
        
        station.setName(request.name());
        stationRepository.save(station);
    }

    @Transactional
    public void deleteStation(UUID id) {
        if (!stationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Gare non trouvée");
        }
        // check if station is used in any line node or ticket
        if (lineNodeRepository.existsByStationId(id) 
            || ticketRepository.existsByOriginStationIdOrDestinationStationId(id, id)) {
            throw new DataConflictException("Cette gare est utilisée");
        }

        stationRepository.deleteById(id);
    }
}
