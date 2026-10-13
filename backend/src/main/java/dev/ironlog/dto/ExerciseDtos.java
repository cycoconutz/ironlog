package dev.ironlog.dto;

import dev.ironlog.domain.Equipment;
import dev.ironlog.domain.ExerciseCategory;
import dev.ironlog.domain.MuscleGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class ExerciseDtos {

    private ExerciseDtos() {
    }

    public record ExerciseResponse(
            UUID id,
            String name,
            ExerciseCategory category,
            MuscleGroup primaryMuscle,
            Equipment equipment,
            boolean bodyweight,
            boolean custom) {
    }

    public record ExerciseRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull ExerciseCategory category,
            @NotNull MuscleGroup primaryMuscle,
            @NotNull Equipment equipment,
            Boolean bodyweight) {
    }
}
