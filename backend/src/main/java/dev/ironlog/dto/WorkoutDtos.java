package dev.ironlog.dto;

import dev.ironlog.domain.MuscleGroup;
import dev.ironlog.domain.SetType;
import dev.ironlog.domain.WorkoutStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class WorkoutDtos {

    private WorkoutDtos() {
    }

    public record SetRequest(
            @PositiveOrZero @Max(1000) Integer reps,
            @PositiveOrZero @DecimalMax("2000.00") BigDecimal weightKg,
            @PositiveOrZero @Max(86400) Integer durationSeconds,
            @PositiveOrZero @DecimalMax("1000000.00") BigDecimal distanceMeters,
            @Min(1) @Max(10) Integer rpe,
            SetType type) {
    }

    public record WorkoutExerciseRequest(
            @NotNull UUID exerciseId,
            @Size(max = 500) String notes,
            @Size(max = 100) @Valid List<SetRequest> sets) {
    }

    public record WorkoutRequest(
            @Size(max = 120) String title,
            Instant startedAt,
            Instant completedAt,
            @Size(max = 2000) String notes,
            WorkoutStatus status,
            @Size(max = 50) @Valid List<WorkoutExerciseRequest> exercises) {
    }

    public record SetResponse(
            UUID id,
            int position,
            Integer reps,
            BigDecimal weightKg,
            Integer durationSeconds,
            BigDecimal distanceMeters,
            Integer rpe,
            SetType type) {
    }

    public record WorkoutExerciseResponse(
            UUID id,
            UUID exerciseId,
            String exerciseName,
            MuscleGroup primaryMuscle,
            int position,
            String notes,
            BigDecimal volumeKg,
            List<SetResponse> sets) {
    }

    public record WorkoutResponse(
            UUID id,
            String title,
            Instant startedAt,
            Instant completedAt,
            WorkoutStatus status,
            String notes,
            int exerciseCount,
            int setCount,
            BigDecimal totalVolumeKg,
            BigDecimal totalDistanceMeters,
            long durationSeconds,
            List<WorkoutExerciseResponse> exercises) {
    }

    public record WorkoutSummary(
            UUID id,
            String title,
            Instant startedAt,
            Instant completedAt,
            WorkoutStatus status,
            int exerciseCount,
            int setCount,
            BigDecimal totalVolumeKg,
            BigDecimal totalDistanceMeters) {
    }

    public record PageResponse<T>(
            List<T> items,
            int page,
            int size,
            long totalItems,
            int totalPages,
            boolean hasNext) {
    }
}
