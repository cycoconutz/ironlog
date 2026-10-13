package dev.ironlog.web;

import dev.ironlog.dto.WorkoutDtos;
import dev.ironlog.security.SecurityUtils;
import dev.ironlog.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/workouts")
@Tag(name = "Workouts", description = "Log and manage training sessions")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @GetMapping
    @Operation(summary = "Paginated workout history, newest first")
    public WorkoutDtos.PageResponse<WorkoutDtos.WorkoutSummary> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return workoutService.list(SecurityUtils.currentUserId(), from, to, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Full detail for one workout")
    public WorkoutDtos.WorkoutResponse get(@PathVariable UUID id) {
        return workoutService.get(SecurityUtils.currentUserId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a workout with nested exercises and sets")
    public WorkoutDtos.WorkoutResponse create(@Valid @RequestBody WorkoutDtos.WorkoutRequest request) {
        return workoutService.create(SecurityUtils.currentUserId(), request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Replace a workout, its exercises and sets")
    public WorkoutDtos.WorkoutResponse update(@PathVariable UUID id,
                                              @Valid @RequestBody WorkoutDtos.WorkoutRequest request) {
        return workoutService.update(SecurityUtils.currentUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a workout")
    public void delete(@PathVariable UUID id) {
        workoutService.delete(SecurityUtils.currentUserId(), id);
    }
}
