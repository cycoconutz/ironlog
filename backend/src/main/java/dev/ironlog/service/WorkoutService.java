package dev.ironlog.service;

import dev.ironlog.domain.Exercise;
import dev.ironlog.domain.SetEntry;
import dev.ironlog.domain.SetType;
import dev.ironlog.domain.User;
import dev.ironlog.domain.Workout;
import dev.ironlog.domain.WorkoutExercise;
import dev.ironlog.domain.WorkoutStatus;
import dev.ironlog.dto.WorkoutDtos;
import dev.ironlog.error.ApiException;
import dev.ironlog.repo.ExerciseRepository;
import dev.ironlog.repo.WorkoutRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkoutService {

    private static final int MAX_PAGE_SIZE = 100;

    private final WorkoutRepository workouts;
    private final ExerciseRepository exercises;
    private final AuthService authService;

    public WorkoutService(WorkoutRepository workouts, ExerciseRepository exercises, AuthService authService) {
        this.workouts = workouts;
        this.exercises = exercises;
        this.authService = authService;
    }

    @Transactional
    public WorkoutDtos.WorkoutResponse create(UUID userId, WorkoutDtos.WorkoutRequest request) {
        User user = authService.require(userId);
        Workout workout = new Workout();
        workout.setUser(user);
        apply(workout, userId, request);
        workouts.save(workout);
        return WorkoutMapper.toWorkoutResponse(workout);
    }

    @Transactional
    public WorkoutDtos.WorkoutResponse update(UUID userId, UUID id, WorkoutDtos.WorkoutRequest request) {
        Workout workout = requireOwned(userId, id);
        apply(workout, userId, request);
        return WorkoutMapper.toWorkoutResponse(workout);
    }

    @Transactional(readOnly = true)
    public WorkoutDtos.WorkoutResponse get(UUID userId, UUID id) {
        return WorkoutMapper.toWorkoutResponse(requireOwned(userId, id));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        workouts.delete(requireOwned(userId, id));
    }

    @Transactional(readOnly = true)
    public WorkoutDtos.PageResponse<WorkoutDtos.WorkoutSummary> list(UUID userId, Instant from, Instant to,
                                                                      int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<Workout> result = (from != null && to != null)
                ? workouts.findByUserIdAndStartedAtBetweenOrderByStartedAtDesc(userId, from, to, pageable)
                : workouts.findByUserIdOrderByStartedAtDesc(userId, pageable);

        List<UUID> ids = result.getContent().stream().map(Workout::getId).toList();
        Map<UUID, WorkoutRepository.WorkoutAggregate> aggregates = ids.isEmpty()
                ? Map.of()
                : workouts.aggregateByIds(ids, userId).stream()
                        .collect(Collectors.toMap(WorkoutRepository.WorkoutAggregate::getId, Function.identity()));

        List<WorkoutDtos.WorkoutSummary> items = result.getContent().stream()
                .map(workout -> {
                    WorkoutRepository.WorkoutAggregate agg = aggregates.get(workout.getId());
                    int exerciseCount = agg == null ? 0 : (int) agg.getExerciseCount();
                    int setCount = agg == null ? 0 : (int) agg.getSetCount();
                    var volume = agg == null ? java.math.BigDecimal.ZERO : agg.getVolumeKg();
                    var distance = agg == null ? java.math.BigDecimal.ZERO : agg.getDistanceMeters();
                    return WorkoutMapper.toSummary(workout, exerciseCount, setCount, volume, distance);
                })
                .toList();

        return new WorkoutDtos.PageResponse<>(
                items,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext());
    }

    private void apply(Workout workout, UUID userId, WorkoutDtos.WorkoutRequest request) {
        workout.setTitle(request.title());

        Instant startedAt = request.startedAt() != null ? request.startedAt() : Instant.now();
        workout.setStartedAt(startedAt);

        WorkoutStatus status = request.status() != null
                ? request.status()
                : WorkoutStatus.COMPLETED;
        workout.setStatus(status);

        if (status == WorkoutStatus.COMPLETED) {
            Instant completedAt = request.completedAt() != null ? request.completedAt() : Instant.now();
            if (completedAt.isBefore(startedAt)) {
                throw ApiException.badRequest("completedAt cannot be before startedAt");
            }
            workout.setCompletedAt(completedAt);
        } else {
            workout.setCompletedAt(request.completedAt());
        }

        workout.setNotes(request.notes());

        workout.clearExercises();
        if (request.exercises() != null) {
            for (WorkoutDtos.WorkoutExerciseRequest exerciseRequest : request.exercises()) {
                Exercise exercise = requireVisibleExercise(userId, exerciseRequest.exerciseId());
                WorkoutExercise workoutExercise = new WorkoutExercise();
                workoutExercise.setExercise(exercise);
                workoutExercise.setNotes(exerciseRequest.notes());
                if (exerciseRequest.sets() != null) {
                    for (WorkoutDtos.SetRequest setRequest : exerciseRequest.sets()) {
                        workoutExercise.addSet(toSet(setRequest));
                    }
                }
                workout.addExercise(workoutExercise);
            }
        }
    }

    private SetEntry toSet(WorkoutDtos.SetRequest request) {
        SetEntry set = new SetEntry();
        set.setReps(request.reps());
        set.setWeightKg(request.weightKg());
        set.setDurationSeconds(request.durationSeconds());
        set.setDistanceMeters(request.distanceMeters());
        set.setRpe(request.rpe());
        set.setType(request.type() != null ? request.type() : SetType.NORMAL);
        return set;
    }

    private Exercise requireVisibleExercise(UUID userId, UUID exerciseId) {
        Exercise exercise = exercises.findById(exerciseId)
                .orElseThrow(() -> ApiException.badRequest("Unknown exercise: " + exerciseId));
        boolean visible = exercise.getOwner() == null || exercise.getOwner().getId().equals(userId);
        if (!visible) {
            throw ApiException.badRequest("Unknown exercise: " + exerciseId);
        }
        return exercise;
    }

    private Workout requireOwned(UUID userId, UUID id) {
        return workouts.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Workout not found"));
    }
}
