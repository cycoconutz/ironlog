package dev.ironlog.service;

import dev.ironlog.domain.SetEntry;
import dev.ironlog.domain.Workout;
import dev.ironlog.domain.WorkoutExercise;
import dev.ironlog.dto.WorkoutDtos;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

public final class WorkoutMapper {

    private WorkoutMapper() {
    }

    public static WorkoutDtos.SetResponse toSetResponse(SetEntry set) {
        return new WorkoutDtos.SetResponse(
                set.getId(),
                set.getPosition(),
                set.getReps(),
                set.getWeightKg(),
                set.getDurationSeconds(),
                set.getDistanceMeters(),
                set.getRpe(),
                set.getType());
    }

    public static WorkoutDtos.WorkoutExerciseResponse toExerciseResponse(WorkoutExercise we) {
        List<WorkoutDtos.SetResponse> sets = we.getSets().stream()
                .map(WorkoutMapper::toSetResponse)
                .toList();
        BigDecimal volume = we.getSets().stream()
                .map(Analytics::volumeKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new WorkoutDtos.WorkoutExerciseResponse(
                we.getId(),
                we.getExercise().getId(),
                we.getExercise().getName(),
                we.getExercise().getPrimaryMuscle(),
                we.getPosition(),
                we.getNotes(),
                Analytics.scale(volume),
                sets);
    }

    public static WorkoutDtos.WorkoutResponse toWorkoutResponse(Workout workout) {
        List<WorkoutDtos.WorkoutExerciseResponse> exercises = workout.getExercises().stream()
                .map(WorkoutMapper::toExerciseResponse)
                .toList();

        int setCount = 0;
        BigDecimal volume = BigDecimal.ZERO;
        BigDecimal distance = BigDecimal.ZERO;
        for (WorkoutExercise we : workout.getExercises()) {
            setCount += we.getSets().size();
            for (SetEntry set : we.getSets()) {
                volume = volume.add(Analytics.volumeKg(set));
                if (set.getDistanceMeters() != null) {
                    distance = distance.add(set.getDistanceMeters());
                }
            }
        }

        return new WorkoutDtos.WorkoutResponse(
                workout.getId(),
                workout.getTitle(),
                workout.getStartedAt(),
                workout.getCompletedAt(),
                workout.getStatus(),
                workout.getNotes(),
                workout.getExercises().size(),
                setCount,
                Analytics.scale(volume),
                Analytics.scale(distance),
                durationSeconds(workout),
                exercises);
    }

    public static WorkoutDtos.WorkoutSummary toSummary(Workout workout,
                                                       int exerciseCount,
                                                       int setCount,
                                                       BigDecimal volumeKg,
                                                       BigDecimal distanceMeters) {
        return new WorkoutDtos.WorkoutSummary(
                workout.getId(),
                workout.getTitle(),
                workout.getStartedAt(),
                workout.getCompletedAt(),
                workout.getStatus(),
                exerciseCount,
                setCount,
                Analytics.scale(volumeKg),
                Analytics.scale(distanceMeters));
    }

    public static long durationSeconds(Workout workout) {
        if (workout.getStartedAt() == null || workout.getCompletedAt() == null) {
            return 0L;
        }
        long seconds = Duration.between(workout.getStartedAt(), workout.getCompletedAt()).getSeconds();
        return Math.max(seconds, 0L);
    }
}
