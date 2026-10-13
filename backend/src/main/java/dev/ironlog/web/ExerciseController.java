package dev.ironlog.web;

import dev.ironlog.domain.ExerciseCategory;
import dev.ironlog.domain.MuscleGroup;
import dev.ironlog.dto.ExerciseDtos;
import dev.ironlog.security.SecurityUtils;
import dev.ironlog.service.ExerciseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
@Tag(name = "Exercises", description = "Global catalog plus your custom movements")
public class ExerciseController {

    private final ExerciseService exerciseService;

    public ExerciseController(ExerciseService exerciseService) {
        this.exerciseService = exerciseService;
    }

    @GetMapping
    @Operation(summary = "List exercises visible to the current user")
    public List<ExerciseDtos.ExerciseResponse> list(@RequestParam(required = false) ExerciseCategory category,
                                                    @RequestParam(required = false) MuscleGroup muscle,
                                                    @RequestParam(required = false) String q) {
        return exerciseService.list(SecurityUtils.currentUserId(), category, muscle, q);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Fetch a single exercise")
    public ExerciseDtos.ExerciseResponse get(@PathVariable UUID id) {
        return exerciseService.get(SecurityUtils.currentUserId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a custom exercise")
    public ExerciseDtos.ExerciseResponse create(@Valid @RequestBody ExerciseDtos.ExerciseRequest request) {
        return exerciseService.create(SecurityUtils.currentUserId(), request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a custom exercise you own")
    public ExerciseDtos.ExerciseResponse update(@PathVariable UUID id,
                                                @Valid @RequestBody ExerciseDtos.ExerciseRequest request) {
        return exerciseService.update(SecurityUtils.currentUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a custom exercise you own")
    public void delete(@PathVariable UUID id) {
        exerciseService.delete(SecurityUtils.currentUserId(), id);
    }
}
