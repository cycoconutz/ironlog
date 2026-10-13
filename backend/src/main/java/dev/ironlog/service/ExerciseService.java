package dev.ironlog.service;

import dev.ironlog.domain.Exercise;
import dev.ironlog.domain.ExerciseCategory;
import dev.ironlog.domain.MuscleGroup;
import dev.ironlog.domain.User;
import dev.ironlog.dto.ExerciseDtos;
import dev.ironlog.error.ApiException;
import dev.ironlog.repo.ExerciseRepository;
import dev.ironlog.repo.WorkoutRepository;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExerciseService {

    private final ExerciseRepository exercises;
    private final WorkoutRepository workouts;
    private final AuthService authService;

    public ExerciseService(ExerciseRepository exercises, WorkoutRepository workouts, AuthService authService) {
        this.exercises = exercises;
        this.workouts = workouts;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public List<ExerciseDtos.ExerciseResponse> list(UUID userId, ExerciseCategory category,
                                                    MuscleGroup muscle, String query) {
        String needle = query == null ? null : query.trim().toLowerCase(Locale.ROOT);
        return exercises.findVisibleTo(userId).stream()
                .filter(exercise -> category == null || exercise.getCategory() == category)
                .filter(exercise -> muscle == null || exercise.getPrimaryMuscle() == muscle)
                .filter(exercise -> needle == null || needle.isEmpty()
                        || exercise.getName().toLowerCase(Locale.ROOT).contains(needle))
                .map(ExerciseService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExerciseDtos.ExerciseResponse get(UUID userId, UUID id) {
        return toResponse(requireVisible(userId, id));
    }

    @Transactional
    public ExerciseDtos.ExerciseResponse create(UUID userId, ExerciseDtos.ExerciseRequest request) {
        String name = request.name().trim();
        if (exercises.existsByOwnerIdAndNameIgnoreCase(userId, name)
                || exercises.findByOwnerIsNullAndNameIgnoreCase(name).isPresent()) {
            throw ApiException.conflict("An exercise named '" + name + "' already exists");
        }
        User owner = authService.require(userId);
        Exercise exercise = new Exercise();
        exercise.setName(name);
        exercise.setCategory(request.category());
        exercise.setPrimaryMuscle(request.primaryMuscle());
        exercise.setEquipment(request.equipment());
        exercise.setBodyweight(Boolean.TRUE.equals(request.bodyweight()));
        exercise.setOwner(owner);
        exercise.setCustom(true);
        exercises.save(exercise);
        return toResponse(exercise);
    }

    @Transactional
    public ExerciseDtos.ExerciseResponse update(UUID userId, UUID id, ExerciseDtos.ExerciseRequest request) {
        Exercise exercise = requireOwned(userId, id);
        String name = request.name().trim();
        if (!exercise.getName().equalsIgnoreCase(name)
                && (exercises.existsByOwnerIdAndNameIgnoreCase(userId, name)
                    || exercises.findByOwnerIsNullAndNameIgnoreCase(name).isPresent())) {
            throw ApiException.conflict("An exercise named '" + name + "' already exists");
        }
        exercise.setName(name);
        exercise.setCategory(request.category());
        exercise.setPrimaryMuscle(request.primaryMuscle());
        exercise.setEquipment(request.equipment());
        exercise.setBodyweight(Boolean.TRUE.equals(request.bodyweight()));
        return toResponse(exercise);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        Exercise exercise = requireOwned(userId, id);
        if (workouts.countUsagesOfExercise(id) > 0) {
            throw ApiException.conflict("This exercise is used by existing workouts; remove it from them first");
        }
        exercises.delete(exercise);
    }

    private Exercise requireOwned(UUID userId, UUID id) {
        Exercise exercise = exercises.findById(id)
                .orElseThrow(() -> ApiException.notFound("Exercise not found"));
        if (exercise.getOwner() == null || !exercise.getOwner().getId().equals(userId)) {
            throw ApiException.forbidden("Only custom exercises you created can be changed");
        }
        return exercise;
    }

    private Exercise requireVisible(UUID userId, UUID id) {
        Exercise exercise = exercises.findById(id)
                .orElseThrow(() -> ApiException.notFound("Exercise not found"));
        boolean visible = exercise.getOwner() == null || exercise.getOwner().getId().equals(userId);
        if (!visible) {
            throw ApiException.notFound("Exercise not found");
        }
        return exercise;
    }

    public static ExerciseDtos.ExerciseResponse toResponse(Exercise exercise) {
        return new ExerciseDtos.ExerciseResponse(
                exercise.getId(),
                exercise.getName(),
                exercise.getCategory(),
                exercise.getPrimaryMuscle(),
                exercise.getEquipment(),
                exercise.isBodyweight(),
                exercise.isCustom());
    }
}
