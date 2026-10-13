package dev.ironlog.web;

import dev.ironlog.dto.StatsDtos;
import dev.ironlog.security.SecurityUtils;
import dev.ironlog.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@Tag(name = "Stats", description = "Derived analytics: volume, distribution, records and progress")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Lifetime totals, streaks and this week's count")
    public StatsDtos.Summary summary() {
        return statsService.summary(SecurityUtils.currentUserId());
    }

    @GetMapping("/volume")
    @Operation(summary = "Weekly training volume for a rolling window")
    public List<StatsDtos.VolumePoint> volume(@RequestParam(defaultValue = "12") int weeks) {
        return statsService.volumeSeries(SecurityUtils.currentUserId(), weeks);
    }

    @GetMapping("/muscles")
    @Operation(summary = "Volume by muscle group over a window")
    public List<StatsDtos.MuscleSlice> muscles(@RequestParam(defaultValue = "30") int days) {
        return statsService.muscleDistribution(SecurityUtils.currentUserId(), days);
    }

    @GetMapping("/records")
    @Operation(summary = "Personal records and estimated one-rep maxes per exercise")
    public List<StatsDtos.PersonalRecord> records() {
        return statsService.personalRecords(SecurityUtils.currentUserId());
    }

    @GetMapping("/exercises/{exerciseId}")
    @Operation(summary = "Progress history for a single exercise")
    public StatsDtos.ExerciseProgress exerciseProgress(@PathVariable UUID exerciseId,
                                                       @RequestParam(defaultValue = "180") int days) {
        return statsService.exerciseProgress(SecurityUtils.currentUserId(), exerciseId, days);
    }
}
