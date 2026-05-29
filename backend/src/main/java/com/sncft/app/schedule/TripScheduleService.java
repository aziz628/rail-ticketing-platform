package com.sncft.app.schedule;

import com.sncft.app.infrastructure.line.Line;
import com.sncft.app.infrastructure.line.LineNode;
import com.sncft.app.infrastructure.train.Train;
import com.sncft.app.infrastructure.train.TrainRepository;
import com.sncft.app.shared.dto.PaginatedResponse;
import com.sncft.app.shared.exception.DataConflictException;
import com.sncft.app.shared.exception.ResourceNotFoundException;
import com.sncft.app.staff.ControllerLine;
import com.sncft.app.staff.ControllerLineRepository;
import com.sncft.app.trip.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sncft.app.schedule.ScheduleCreateRequest.ScheduleStopRequest;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TripScheduleService {

    private final TripScheduleRepository scheduleRepository;
    private final TrainRepository trainRepository;
    private final ControllerLineRepository controllerLineRepository;
    private final TripRepository tripRepository;
    private final ScheduleMapper scheduleMapper;

    @Transactional(readOnly = true)
    public PaginatedResponse<ScheduleResponse> getActiveSchedules(UUID lineId, Pageable pageable) {
        // find active schedules for the given line
        Page<TripSchedule> schedulePage = scheduleRepository.findActiveSchedules(lineId, LocalDate.now(), pageable);

        // find any trips that use the current schedules
        Set<UUID> idsWithTrips = tripRepository.findScheduleIdsWithTrips(
                schedulePage.getContent().stream().map(TripSchedule::getId).collect(Collectors.toSet()));

        // get last trip date for each schedule and build map with ids and dates
        Map<UUID, LocalDate> lastTripDates = tripRepository.findLatestTripDatesForSchedules(
                schedulePage.getContent().stream().map(TripSchedule::getId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (LocalDate) row[1]));

        // map schedule to ScheduleResponse with canDelete flag and minDeactivationDate
        return PaginatedResponse.of(schedulePage, schedulePage.getContent().stream()
                .map(s -> {
                    // get latest trip date for the current schedule
                    LocalDate latestTripDate = lastTripDates.get(s.getId());
                    // get the minimum date for schedule deactivation
                    LocalDate minDate = Stream.of(LocalDate.now(), s.getActivationDate(), latestTripDate)
                            .filter(Objects::nonNull)
                            .max(LocalDate::compareTo)
                            .orElse(LocalDate.now());

                    return scheduleMapper.toResponse(s, !idsWithTrips.contains(s.getId()), minDate);
                })
                .collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ScheduleResponse> getInactiveSchedules(UUID lineId, Pageable pageable) {
        // get all schedules for the given line that are inactive
        Page<TripSchedule> schedulePage = scheduleRepository.findInactiveSchedules(lineId, LocalDate.now(), pageable);

        // map schedule to ScheduleResponse
        return PaginatedResponse.of(schedulePage, schedulePage.getContent().stream()
                .map(scheduleMapper::toResponse).toList());
    }

    @Transactional
    public void createSchedule(ScheduleCreateRequest request) {
        // check if controller exist
        ControllerLine controllerLine = controllerLineRepository.findByUserId(request.controllerId())
                .orElseThrow(() -> new ResourceNotFoundException("Contrôleur non trouvé"));

        // check if the controller is assigned to the selected line
        if (!controllerLine.getLine().getId().equals(request.lineId())) {
            throw new IllegalArgumentException("Le contrôleur n'est pas assigné à la ligne spécifiée");
        }
        // check if train exist
        Train train = trainRepository.findById(request.trainId())
                .orElseThrow(() -> new ResourceNotFoundException("Train non trouvé"));

        Line line = controllerLine.getLine();

        // get first and last nodes from line list of nodes
        LineNode firstNode = line.getNodes().get(0);
        LineNode lastNode = line.getNodes().getLast();

        // verify that trip stops contains the first and last node of the line
        if (!request.stops().get(0).lineNodeId().equals(firstNode.getId()) ||
                !request.stops().getLast().lineNodeId().equals(lastNode.getId())) {
            throw new IllegalArgumentException(
                    "Les arrêts doivent contenir le premier et le dernier arrêt de la ligne.");
        }

        // Check for controller schedules conflicts
        checkControllerConflicts(request.controllerId(), request.daysBitmask(), 
                request.activationDate(), request.deactivationDate(), 
                request.stops().get(0).arrivalTime(), request.stops().getLast().arrivalTime());

        // build schedule object
        TripSchedule schedule = TripSchedule.builder()
                .line(line)
                .train(train)
                .controller(controllerLine.getUser())
                .daysBitmask(request.daysBitmask())
                .activationDate(request.activationDate())
                .deactivationDate(request.deactivationDate())
                .build();

        // Create a map for quick lookup of nodes belonging to this line
        Map<UUID, LineNode> lineNodesMap = line.getNodes().stream()
                .collect(Collectors.toMap(LineNode::getId, node -> node));

        // Verify that the requested stops order exactly match the line nodes sequence
        int lastOrder = -1;
        for (ScheduleStopRequest stopReq : request.stops()) {
            LineNode node = lineNodesMap.get(stopReq.lineNodeId());
            if (node == null) {
                throw new IllegalArgumentException("Un des arrêts spécifiés n'appartient pas à la ligne sélectionnée");
            }

            // check if the line node order is bigger than last node in the schedule stops
            if (node.getOrderIndex() <= lastOrder) {
                throw new IllegalArgumentException("Les arrêts doivent respecter l'ordre géographique de la ligne.");
            }
            lastOrder = node.getOrderIndex();

            TripStop stop = TripStop.builder()
                    .lineNode(node)
                    .arrivalTime(stopReq.arrivalTime())
                    .build();
            schedule.addStop(stop);
        }

        scheduleRepository.save(schedule);
    }

    @Transactional
    public void deleteSchedule(UUID id) {
        long tripCount = tripRepository.countByTripScheduleId(id);
        // check if schedule has any trip
        if (tripCount > 0) {
            throw new DataConflictException("horaire lié à des voyages.");
        }
        scheduleRepository.deleteById(id);
    }

    @Transactional
    public void deactivateSchedule(UUID id, LocalDate deactivationDate) {
        TripSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horaire non trouvé"));

        // check if schedule is already deactivated
        if (schedule.getDeactivationDate() != null) {
            throw new DataConflictException("horaire est déjà désactivé");
        }

        // get latest trip date for the current schedule
        LocalDate latestTrip = tripRepository.findLatestTripDatesForSchedules(List.of(id))
                .stream().map(row -> (LocalDate) row[1]).findFirst().orElse(null);

        // get the minimum date for schedule deactivation
        LocalDate minDate = Stream.of(LocalDate.now(), schedule.getActivationDate().plusDays(1), latestTrip)
                .filter(Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(LocalDate.now());

        if (deactivationDate.isBefore(minDate)) {
            throw new IllegalArgumentException("La date de désactivation doit être supérieure  à: " + minDate);
        }

        schedule.setDeactivationDate(deactivationDate);
        scheduleRepository.save(schedule);
    }

    @Transactional
    public void reassignController(UUID id, UUID newControllerId) {
        TripSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horaire non trouvé"));

        // if it's the same controller, no need to reassign or check conflicts
        if (schedule.getController().getId().equals(newControllerId)) {
            return;
        }

        // if schedule is deactivation date passed throw exception
        if (schedule.getDeactivationDate() != null && (!schedule.getDeactivationDate().isAfter(LocalDate.now()))) {
            throw new DataConflictException("Schedule is deactivated");
        }

        ControllerLine controllerLine = controllerLineRepository.findByUserId(newControllerId)
                .orElseThrow(() -> new ResourceNotFoundException("Contrôleur non trouvé ou non assigné"));

        if (!controllerLine.getLine().getId().equals(schedule.getLine().getId())) {
            throw new IllegalArgumentException("Contrôleur non assigné à cette ligne");
        }

        // Verify the new controller is free for this schedule's slot
        checkControllerConflicts(
                newControllerId,
                schedule.getDaysBitmask(),
                schedule.getActivationDate(),
                schedule.getDeactivationDate(),
                schedule.getStops().get(0).getArrivalTime(),
                schedule.getStops().get(schedule.getStops().size() - 1).getArrivalTime());

        schedule.setController(controllerLine.getUser());
        scheduleRepository.save(schedule);
    }

    /**
     * see if controller is already assigned to a schedule
     * 
     * check overlap in date range finding any day of intersection
     * then check overlap in time interval
     */
    private void checkControllerConflicts(UUID controllerId, String newBitmask,
            LocalDate newStart, LocalDate newEnd,
            LocalTime newStartT, LocalTime newEndT) {

        // fetch active schedules for the given controller
        List<TripSchedule> existingSchedules = scheduleRepository.findActiveByControllerId(controllerId);

        // check any overlapping schedule with new one
        for (TripSchedule existing : existingSchedules) {
            // store intersecting days indexes for this existing schedule
            List<Integer> newScheduleIntersectingDays = new ArrayList<>();

            // existing schedule date range
            LocalDate existingScheduleActivationDate = existing.getActivationDate();
            LocalDate existingScheduleDeactivationDate = existing.getDeactivationDate();

            // Date range intersection check
            boolean dateOverlap = (newEnd == null || !newEnd.isBefore(existingScheduleActivationDate))
                    && (existingScheduleDeactivationDate == null
                            || !existingScheduleDeactivationDate.isBefore(newStart));

            if (!dateOverlap)
                continue;

            // save the actual overlap interval
            LocalDate overlapStart = newStart.isAfter(existingScheduleActivationDate) ? newStart
                    : existingScheduleActivationDate;
            // if new end is null or it's after the existing one, save existing one
            LocalDate overlapEnd = (newEnd == null
                    || (existingScheduleDeactivationDate != null && newEnd.isAfter(existingScheduleDeactivationDate)))
                            ? existingScheduleDeactivationDate
                            : newEnd;

            // check which of the schedule days are in the overlap interval
            int counter = 0;
            LocalDate currentDate = overlapStart;
            while (counter < 7 && (overlapEnd == null || !currentDate.isAfter(overlapEnd))) {
                int dayIndex = currentDate.getDayOfWeek().getValue() - 1; // Mon=0, Sun=6

                // If both schedules operate on this specific calendar day
                if (newBitmask.charAt(dayIndex) == '1' && existing.getDaysBitmask().charAt(dayIndex) == '1') {
                    newScheduleIntersectingDays.add(dayIndex);
                }
                counter++;
                currentDate = currentDate.plusDays(1);
                if (newScheduleIntersectingDays.size() > 0)
                    break; // one match is enough to trigger time check
            }

            // if no intersection days in this period, skip to next schedule
            if (newScheduleIntersectingDays.isEmpty())
                continue;

            // Time interval overlap check
            LocalTime extStartT = existing.getStops().get(0).getArrivalTime();
            LocalTime extEndT = existing.getStops().get(existing.getStops().size() - 1).getArrivalTime();

            if (newStartT.isBefore(extEndT) && extStartT.isBefore(newEndT)) {
                throw new DataConflictException("contrôleur deja assigné à (" + extStartT + " - " + extEndT + ")");
            }
        }
    }
}
