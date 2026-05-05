package com.sncft.app.infrastructure.station;

import com.sncft.app.infrastructure.line.LineNodeRepository;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.DuplicateResourceException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StationService {

    private final StationRepository stationRepository;
    private final LineNodeRepository lineNodeRepository;
    private final StationMapper stationMapper;

    @Transactional(readOnly = true)
    public PaginatedResponse<StationResponse> getAllStations(int page, int size) {
        Page<StationResponse> pageResult = stationRepository.findAllWithDeleteFlag(PageRequest.of(page, size));
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
            throw new ResourceNotFoundException("Station not found");
        }
        if (lineNodeRepository.existsByStationId(id)) {
            throw new DataConflictException("gare utilisée dans une ou plusieurs lignes");
        }
        stationRepository.deleteById(id);
    }
}
