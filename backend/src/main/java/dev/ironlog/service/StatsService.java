package dev.ironlog.service;

import dev.ironlog.domain.Exercise;
import dev.ironlog.domain.MuscleGroup;
import dev.ironlog.domain.SetEntry;
import dev.ironlog.domain.Workout;
import dev.ironlog.dto.StatsDtos;
import dev.ironlog.error.ApiException;
import dev.ironlog.repo.ExerciseRepository;
import dev.ironlog.repo.SetEntryRepository;
import dev.ironlog.repo.WorkoutRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    private final WorkoutRepository workouts;
    private final SetEntryRepository setEntries;
    private final ExerciseRepository exercises;

    public StatsService(WorkoutRepository workouts, SetEntryRepository setEntries, ExerciseRepository exercises) {
        this.workouts = workouts;
        this.setEntries = setEntries;
        this.exercises = exercises;
    }

    @Transactional(readOnly = true)
    public StatsDtos.Summary summary(UUID userId) {
        List<Workout> allWorkouts = workouts.findByUserIdOrderByStartedAtDesc(userId);
        List<SetEntry> entries = setEntries.findForStats(userId, Instant.EPOCH);

        long totalSets = entries.size();
        long totalReps = entries.stream().mapToLong(e -> e.getReps() == null ? 0 : e.getReps()).sum();
        BigDecimal totalVolume = entries.stream()
                .map(Analytics::volumeKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalSeconds = allWorkouts.stream().mapToLong(WorkoutMapper::durationSeconds).sum();

        Set<LocalDate> trainingDays = allWorkouts.stream()
                .map(w -> toLocalDate(w.getStartedAt()))
                .collect(Collectors.toSet());

        Instant weekStart = startOfWeek(LocalDate.now(ZoneOffset.UTC))
                .atStartOfDay(ZoneOffset.UTC).toInstant();
        long workoutsThisWeek = workouts.countByUserIdAndStartedAtGreaterThanEqual(userId, weekStart);

        long totalWorkouts = allWorkouts.size();
        BigDecimal average = totalWorkouts == 0
                ? BigDecimal.ZERO
                : totalVolume.divide(BigDecimal.valueOf(totalWorkouts), 2, RoundingMode.HALF_UP);

        return new StatsDtos.Summary(
                totalWorkouts,
                workoutsThisWeek,
                totalSets,
                totalReps,
                Analytics.scale(totalVolume),
                currentStreak(trainingDays),
                longestStreak(trainingDays),
                totalSeconds / 60,
                average);
    }

    @Transactional(readOnly = true)
    public List<StatsDtos.VolumePoint> volumeSeries(UUID userId, int weeks) {
        int safeWeeks = Math.min(Math.max(weeks, 1), 104);
        LocalDate currentWeek = startOfWeek(LocalDate.now(ZoneOffset.UTC));
        LocalDate firstWeek = currentWeek.minusWeeks(safeWeeks - 1L);
        Instant since = firstWeek.atStartOfDay(ZoneOffset.UTC).toInstant();

        Map<LocalDate, BigDecimal> volume = new HashMap<>();
        Map<LocalDate, Integer> setCount = new HashMap<>();
        for (SetEntry entry : setEntries.findForStats(userId, since)) {
            LocalDate week = startOfWeek(toLocalDate(entry.getWorkoutExercise().getWorkout().getStartedAt()));
            volume.merge(week, Analytics.volumeKg(entry), BigDecimal::add);
            setCount.merge(week, 1, Integer::sum);
        }

        Map<LocalDate, Integer> workoutCount = new HashMap<>();
        for (Workout workout : workouts.findByUserIdAndStartedAtGreaterThanEqualOrderByStartedAtAsc(userId, since)) {
            workoutCount.merge(startOfWeek(toLocalDate(workout.getStartedAt())), 1, Integer::sum);
        }

        List<StatsDtos.VolumePoint> points = new ArrayList<>();
        for (int i = 0; i < safeWeeks; i++) {
            LocalDate week = firstWeek.plusWeeks(i);
            points.add(new StatsDtos.VolumePoint(
                    week.toString(),
                    Analytics.scale(volume.getOrDefault(week, BigDecimal.ZERO)),
                    workoutCount.getOrDefault(week, 0),
                    setCount.getOrDefault(week, 0)));
        }
        return points;
    }

    @Transactional(readOnly = true)
    public List<StatsDtos.MuscleSlice> muscleDistribution(UUID userId, int days) {
        Instant since = since(days);
        Map<MuscleGroup, BigDecimal> volume = new HashMap<>();
        Map<MuscleGroup, Integer> sets = new HashMap<>();
        Map<MuscleGroup, Integer> reps = new HashMap<>();
        for (SetEntry entry : setEntries.findForStats(userId, since)) {
            MuscleGroup muscle = entry.getWorkoutExercise().getExercise().getPrimaryMuscle();
            volume.merge(muscle, Analytics.volumeKg(entry), BigDecimal::add);
            sets.merge(muscle, 1, Integer::sum);
            reps.merge(muscle, entry.getReps() == null ? 0 : entry.getReps(), Integer::sum);
        }
        return volume.entrySet().stream()
                .map(e -> new StatsDtos.MuscleSlice(e.getKey(), Analytics.scale(e.getValue()),
                        sets.getOrDefault(e.getKey(), 0), reps.getOrDefault(e.getKey(), 0)))
                .sorted(Comparator.comparing(StatsDtos.MuscleSlice::volumeKg).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StatsDtos.PersonalRecord> personalRecords(UUID userId) {
        Map<UUID, List<SetEntry>> byExercise = setEntries.findForStats(userId, Instant.EPOCH).stream()
                .collect(Collectors.groupingBy(e -> e.getWorkoutExercise().getExercise().getId(),
                        LinkedHashMap::new, Collectors.toList()));

        List<StatsDtos.PersonalRecord> records = new ArrayList<>();
        for (Map.Entry<UUID, List<SetEntry>> group : byExercise.entrySet()) {
            List<SetEntry> entries = group.getValue();
            Exercise exercise = entries.get(0).getWorkoutExercise().getExercise();

            SetEntry bestWeight = entries.stream()
                    .filter(e -> e.getWeightKg() != null && e.getWeightKg().signum() > 0)
                    .max(Comparator.comparing(SetEntry::getWeightKg))
                    .orElse(null);

            SetEntry bestOneRm = entries.stream()
                    .max(Comparator.comparing(Analytics::estimatedOneRepMaxKg))
                    .orElse(entries.get(0));

            BigDecimal bestVolume = entries.stream()
                    .map(Analytics::volumeKg)
                    .max(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            long sessions = entries.stream()
                    .map(e -> toLocalDate(e.getWorkoutExercise().getWorkout().getStartedAt()))
                    .distinct()
                    .count();

            records.add(new StatsDtos.PersonalRecord(
                    exercise.getId(),
                    exercise.getName(),
                    exercise.getPrimaryMuscle(),
                    bestWeight == null ? BigDecimal.ZERO : Analytics.scale(bestWeight.getWeightKg()),
                    bestWeight == null ? null : bestWeight.getReps(),
                    Analytics.scale(Analytics.estimatedOneRepMaxKg(bestOneRm)),
                    Analytics.scale(bestVolume),
                    toLocalDate(bestOneRm.getWorkoutExercise().getWorkout().getStartedAt()).toString(),
                    (int) sessions));
        }
        records.sort(Comparator.comparing(StatsDtos.PersonalRecord::exerciseName, String.CASE_INSENSITIVE_ORDER));
        return records;
    }

    @Transactional(readOnly = true)
    public StatsDtos.ExerciseProgress exerciseProgress(UUID userId, UUID exerciseId, int days) {
        Exercise exercise = exercises.findById(exerciseId)
                .orElseThrow(() -> ApiException.notFound("Exercise not found"));
        if (exercise.getOwner() != null && !exercise.getOwner().getId().equals(userId)) {
            throw ApiException.notFound("Exercise not found");
        }

        List<SetEntry> all = setEntries.findForStats(userId, Instant.EPOCH).stream()
                .filter(e -> e.getWorkoutExercise().getExercise().getId().equals(exerciseId))
                .toList();

        Instant since = since(days);
        Map<LocalDate, List<SetEntry>> byDate = all.stream()
                .filter(e -> !e.getWorkoutExercise().getWorkout().getStartedAt().isBefore(since))
                .collect(Collectors.groupingBy(
                        e -> toLocalDate(e.getWorkoutExercise().getWorkout().getStartedAt()),
                        java.util.TreeMap::new,
                        Collectors.toList()));

        List<StatsDtos.ExerciseHistoryPoint> history = new ArrayList<>();
        for (Map.Entry<LocalDate, List<SetEntry>> day : byDate.entrySet()) {
            List<SetEntry> entries = day.getValue();
            BigDecimal topWeight = entries.stream()
                    .map(SetEntry::getWeightKg)
                    .filter(java.util.Objects::nonNull)
                    .max(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);
            BigDecimal volume = entries.stream().map(Analytics::volumeKg).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal bestOneRm = entries.stream().map(Analytics::estimatedOneRepMaxKg)
                    .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            int reps = entries.stream().mapToInt(e -> e.getReps() == null ? 0 : e.getReps()).sum();
            history.add(new StatsDtos.ExerciseHistoryPoint(
                    day.getKey().toString(), Analytics.scale(topWeight), Analytics.scale(volume),
                    Analytics.scale(bestOneRm), entries.size(), reps));
        }

        BigDecimal windowBest = history.stream()
                .map(StatsDtos.ExerciseHistoryPoint::estimated1rmKg)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        BigDecimal allTimeBest = all.stream()
                .map(Analytics::estimatedOneRepMaxKg)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return new StatsDtos.ExerciseProgress(
                exercise.getId(),
                exercise.getName(),
                Analytics.scale(windowBest),
                Analytics.scale(allTimeBest),
                "KG",
                history);
    }

    private static Instant since(int days) {
        int safeDays = Math.min(Math.max(days, 1), 3650);
        return Instant.now().minus(safeDays, ChronoUnit.DAYS);
    }

    private static LocalDate toLocalDate(Instant instant) {
        return instant.atZone(ZoneOffset.UTC).toLocalDate();
    }

    private static LocalDate startOfWeek(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    static int currentStreak(Set<LocalDate> days) {
        if (days.isEmpty()) {
            return 0;
        }
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);
        if (!days.contains(cursor)) {
            return 0;
        }
        int streak = 0;
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    static int longestStreak(Set<LocalDate> days) {
        if (days.isEmpty()) {
            return 0;
        }
        List<LocalDate> sorted = days.stream().sorted().toList();
        int longest = 1;
        int run = 1;
        for (int i = 1; i < sorted.size(); i++) {
            if (sorted.get(i).equals(sorted.get(i - 1).plusDays(1))) {
                run++;
            } else {
                run = 1;
            }
            longest = Math.max(longest, run);
        }
        return longest;
    }
}
