package com.sncft.app.infrastructure.line;

import com.sncft.app.infrastructure.station.Station;
import com.sncft.app.infrastructure.station.StationRepository;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.DuplicateResourceException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LineService {

    private final LineRepository lineRepository;
    private final StationRepository stationRepository;
    private final LineMapper lineMapper;

    @Transactional(readOnly = true)
    public PaginatedResponse<LineResponse> getAllLines(int page, int size) {
        // get lines with pagination 
        Page<Line> linePage = lineRepository.findAllWithNodes(PageRequest.of(page, size));
        List<Line> lines = linePage.getContent();
        
        if (lines.isEmpty()) {
            return PaginatedResponse.of(linePage, Collections.emptyList());
        }
        
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication() != null && 
                SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // get all line ids
        List<UUID> lineIds = lines.stream().map(Line::getId).toList();

        // get all non deletable line ids
        List<UUID> nonDeletableIds = isAdmin ? lineRepository.findNonDeletableLineIds(lineIds) : Collections.emptyList();

        // set canDelete to true if the line is not in the nonDeletableIds list, or null if not admin
        List<LineResponse> content = lines.stream()
                .map(line -> lineMapper.toResponse(line, isAdmin ? !nonDeletableIds.contains(line.getId()) : null))
                .collect(Collectors.toList());
        
        return PaginatedResponse.of(linePage, content);
    }

    @Transactional
    public void createLine(LineRequest request) {
        // Resolve stations in bulk and preserve order
        List<Station> stations = resolveStations(request.nodes());
        String lineName = request.name();

        if (lineRepository.existsByNameIgnoreCase(lineName)) {
            throw new DuplicateResourceException("La ligne '" + lineName + "' existe déjà");
        }

        // Create primary line
        Line line = createLineInternal(lineName, request.nodes(), stations);
        lineRepository.save(line);

        // Handle Reverse Line if requested
        if (request.createReverse()) {
            createReverseLine(request.nodes(), stations, lineName);
        }
    }

    //load all the stations from db and returns them in the same order as the request.
    private List<Station> resolveStations(List<LineNodeRequest> nodes) {
        // Get all stations ids from the nodes
        List<UUID> ids = nodes.stream().map(LineNodeRequest::stationId).toList();
        // get all stations by ids
        List<Station> foundStations = stationRepository.findAllById(ids);
        
        // check if all stations are found
        if (foundStations.size() != ids.size()) {
            throw new ResourceNotFoundException("Une ou plusieurs gares sont introuvables");
        }

        // build a map from found stations to reorder them later by their id fastly 
        Map<UUID, Station> stationMap = foundStations.stream()
                .collect(Collectors.toMap(Station::getId, s -> s));

        // return stations ordered by the ids from the request 
        return ids.stream().map(stationMap::get).collect(Collectors.toList());
    }

    // build line entity with nodes from  list
    private Line createLineInternal(String name, List<LineNodeRequest> nodeRequests, List<Station> stations) {
        Line line = Line.builder().name(name).build();
        for (int i = 0; i < nodeRequests.size(); i++) {
            LineNode node = LineNode.builder()
                    .station(stations.get(i))
                    .kmFromSource(nodeRequests.get(i).kmFromSource())
                    .orderIndex(i)
                    .build();
            line.addNode(node);
        }
        return line;
    }

    private void createReverseLine(List<LineNodeRequest> originalNodes, List<Station> stations, String originalName) {
        // Reverse order of stations and calculate distances
        List<Station> reversedStations = new ArrayList<>(stations);
        Collections.reverse(reversedStations);
        
        // get total distance from the last node
        double totalDist = originalNodes.get(originalNodes.size() - 1).kmFromSource();
        String reverseName = originalName + " (Retour)";

        if (lineRepository.existsByNameIgnoreCase(reverseName)) {
            throw new DuplicateResourceException("Impossible de créer la ligne inverse : le nom '" + reverseName + "' existe déjà");
        }

        //build reverse line
        Line reverseLine = Line.builder().name(reverseName).build();
        for (int i = 0; i < reversedStations.size(); i++) {
            // Find original distance for this station
            double originalDist = originalNodes.get(originalNodes.size() - 1 - i).kmFromSource();

            LineNode node = LineNode.builder()
                    .station(reversedStations.get(i))
                    .kmFromSource(totalDist - originalDist) // get distance from the last node
                    .orderIndex(i)
                    .build();
            reverseLine.addNode(node);
        }
        lineRepository.save(reverseLine);
    }

    @Transactional
    public void deleteLine(UUID id) {
        Line line = lineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ligne non trouvée"));
        
        try {
            lineRepository.delete(line);
            lineRepository.flush(); // flush all pending changes to db to force db call immediately
        } catch (DataIntegrityViolationException e) {
            throw new DataConflictException(
                "Cannot delete line: it is currently in use."
            );
        }
    }
}
