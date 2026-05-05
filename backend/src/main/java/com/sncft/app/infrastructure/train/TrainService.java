package com.sncft.app.infrastructure.train;

import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.DuplicateResourceException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrainService {

    private final TrainRepository trainRepository;
    private final TrainMapper trainMapper;

    @Transactional(readOnly = true)
    public PaginatedResponse<TrainResponse> getAllTrains(int page, int size) {
        Page<Train> trainPage = trainRepository.findAll(PageRequest.of(page, size));
        List<Train> trains = trainPage.getContent();
        
        List<UUID> trainIds = trains.stream().map(Train::getId).toList();
        List<UUID> nonDeletableIds = trainRepository.findNonDeletableTrainIds(trainIds);
        
        List<TrainResponse> content = trains.stream()
                .map(train -> trainMapper.toResponse(train, !nonDeletableIds.contains(train.getId())))
                .toList();
                
        return PaginatedResponse.of(trainPage, content);
    }

    @Transactional
    public void createTrain(TrainRequest request) { 
        if (trainRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Le nom du train existe déjà");
        }
        
        Train train = trainMapper.toEntity(request);
        
        // Manual mapping for seat classes to Train entity
        request.seatClasses().forEach(scRequest -> {
            SeatClass seatClass = trainMapper.toSeatClassEntity(scRequest);
            train.addSeatClass(seatClass);
        });
        
        trainRepository.save(train);
    }

    @Transactional
    public void updateTrain(UUID id, TrainPatchRequest request) {
        Train train = trainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Train non trouvé"));

        if (!train.getName().equalsIgnoreCase(request.name()) && 
            trainRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Train name already exists");
        }

        trainMapper.updateEntity(request, train);

        trainRepository.save(train);
    }

    @Transactional
    public void updateSeatClassPrice(UUID trainId, UUID classId, SeatClassPatchRequest request) {
        Train train = trainRepository.findById(trainId)
                .orElseThrow(() -> new ResourceNotFoundException("Train non trouvé"));

        SeatClass seatClassToUpdate = train.getSeatClasses().stream()
                .filter(sc -> sc.getId().equals(classId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Classe de siège non trouvée dans ce train"));

        seatClassToUpdate.setPriceIncreasePercentage(request.priceIncreasePercentage());
        trainRepository.save(train);
    }

    @Transactional(readOnly = true)
    public TrainResponse getTrainById(UUID id) {
        Train train = trainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Train non trouvé"));
        
        List<UUID> nonDeletableIds = trainRepository.findNonDeletableTrainIds(java.util.List.of(id));
        return trainMapper.toResponse(train, !nonDeletableIds.contains(id));
    }

    @Transactional
    public void deleteTrain(UUID id) {
        Train train = trainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Train non trouvé"));

        try {
            trainRepository.delete(train);
            trainRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new DataConflictException(
                "Le train est actuellement utilisé."
            );
        }
    }
}
