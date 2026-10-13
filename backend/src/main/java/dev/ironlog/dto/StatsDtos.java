package dev.ironlog.dto;

import dev.ironlog.domain.MuscleGroup;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class StatsDtos {

    private StatsDtos() {
    }

    public record Summary(
            long totalWorkouts,
            long workoutsThisWeek,
            long totalSets,
            long totalReps,
            BigDecimal totalVolumeKg,
            int currentStreakDays,
            int longestStreakDays,
            long totalDurationMinutes,
            BigDecimal averageVolumePerWorkoutKg) {
    }

    public record VolumePoint(
            String periodStart,
            BigDecimal volumeKg,
            int workouts,
            int sets) {
    }

    public record MuscleSlice(
            MuscleGroup muscle,
            BigDecimal volumeKg,
            int sets,
            int reps) {
    }

    public record PersonalRecord(
            UUID exerciseId,
            String exerciseName,
            MuscleGroup primaryMuscle,
            BigDecimal bestWeightKg,
            Integer bestWeightReps,
            BigDecimal best1rmKg,
            BigDecimal bestSetVolumeKg,
            String achievedOn,
            int timesPerformed) {
    }

    public record ExerciseHistoryPoint(
            String date,
            BigDecimal topWeightKg,
            BigDecimal volumeKg,
            BigDecimal estimated1rmKg,
            int sets,
            int reps) {
    }

    public record ExerciseProgress(
            UUID exerciseId,
            String exerciseName,
            BigDecimal currentBest1rmKg,
            BigDecimal allTimeBest1rmKg,
            String unit,
            List<ExerciseHistoryPoint> history) {
    }
}
