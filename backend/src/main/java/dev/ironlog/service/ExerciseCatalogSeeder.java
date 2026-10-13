package dev.ironlog.service;

import dev.ironlog.domain.Equipment;
import dev.ironlog.domain.Exercise;
import dev.ironlog.domain.ExerciseCategory;
import dev.ironlog.domain.MuscleGroup;
import dev.ironlog.repo.ExerciseRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Populates the shared exercise catalog once, on first boot. */
@Component
public class ExerciseCatalogSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ExerciseCatalogSeeder.class);

    private record Seed(String name, ExerciseCategory category, MuscleGroup muscle, Equipment equipment, boolean bodyweight) {
    }

    private static final List<Seed> CATALOG = List.of(
            new Seed("Barbell Bench Press", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.BARBELL, false),
            new Seed("Incline Barbell Bench Press", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.BARBELL, false),
            new Seed("Dumbbell Bench Press", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.DUMBBELL, false),
            new Seed("Incline Dumbbell Press", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.DUMBBELL, false),
            new Seed("Machine Chest Press", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.MACHINE, false),
            new Seed("Cable Fly", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.CABLE, false),
            new Seed("Push-Up", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.BODYWEIGHT, true),
            new Seed("Chest Dip", ExerciseCategory.STRENGTH, MuscleGroup.CHEST, Equipment.BODYWEIGHT, true),

            new Seed("Deadlift", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.BARBELL, false),
            new Seed("Barbell Row", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.BARBELL, false),
            new Seed("Dumbbell Row", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.DUMBBELL, false),
            new Seed("T-Bar Row", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.BARBELL, false),
            new Seed("Lat Pulldown", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.CABLE, false),
            new Seed("Seated Cable Row", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.CABLE, false),
            new Seed("Pull-Up", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.BODYWEIGHT, true),
            new Seed("Chin-Up", ExerciseCategory.STRENGTH, MuscleGroup.BACK, Equipment.BODYWEIGHT, true),

            new Seed("Overhead Press", ExerciseCategory.STRENGTH, MuscleGroup.SHOULDERS, Equipment.BARBELL, false),
            new Seed("Seated Dumbbell Press", ExerciseCategory.STRENGTH, MuscleGroup.SHOULDERS, Equipment.DUMBBELL, false),
            new Seed("Arnold Press", ExerciseCategory.STRENGTH, MuscleGroup.SHOULDERS, Equipment.DUMBBELL, false),
            new Seed("Lateral Raise", ExerciseCategory.STRENGTH, MuscleGroup.SHOULDERS, Equipment.DUMBBELL, false),
            new Seed("Cable Lateral Raise", ExerciseCategory.STRENGTH, MuscleGroup.SHOULDERS, Equipment.CABLE, false),
            new Seed("Rear Delt Fly", ExerciseCategory.STRENGTH, MuscleGroup.SHOULDERS, Equipment.DUMBBELL, false),
            new Seed("Face Pull", ExerciseCategory.STRENGTH, MuscleGroup.SHOULDERS, Equipment.CABLE, false),

            new Seed("Barbell Curl", ExerciseCategory.STRENGTH, MuscleGroup.BICEPS, Equipment.BARBELL, false),
            new Seed("Dumbbell Curl", ExerciseCategory.STRENGTH, MuscleGroup.BICEPS, Equipment.DUMBBELL, false),
            new Seed("Hammer Curl", ExerciseCategory.STRENGTH, MuscleGroup.BICEPS, Equipment.DUMBBELL, false),
            new Seed("Preacher Curl", ExerciseCategory.STRENGTH, MuscleGroup.BICEPS, Equipment.EZ_BAR, false),
            new Seed("Cable Curl", ExerciseCategory.STRENGTH, MuscleGroup.BICEPS, Equipment.CABLE, false),

            new Seed("Close-Grip Bench Press", ExerciseCategory.STRENGTH, MuscleGroup.TRICEPS, Equipment.BARBELL, false),
            new Seed("Triceps Pushdown", ExerciseCategory.STRENGTH, MuscleGroup.TRICEPS, Equipment.CABLE, false),
            new Seed("Overhead Triceps Extension", ExerciseCategory.STRENGTH, MuscleGroup.TRICEPS, Equipment.DUMBBELL, false),
            new Seed("Skull Crusher", ExerciseCategory.STRENGTH, MuscleGroup.TRICEPS, Equipment.EZ_BAR, false),
            new Seed("Bench Dip", ExerciseCategory.STRENGTH, MuscleGroup.TRICEPS, Equipment.BODYWEIGHT, true),

            new Seed("Back Squat", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.BARBELL, false),
            new Seed("Front Squat", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.BARBELL, false),
            new Seed("Leg Press", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.MACHINE, false),
            new Seed("Hack Squat", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.MACHINE, false),
            new Seed("Leg Extension", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.MACHINE, false),
            new Seed("Bulgarian Split Squat", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.DUMBBELL, false),
            new Seed("Walking Lunge", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.DUMBBELL, false),
            new Seed("Goblet Squat", ExerciseCategory.STRENGTH, MuscleGroup.QUADS, Equipment.KETTLEBELL, false),

            new Seed("Romanian Deadlift", ExerciseCategory.STRENGTH, MuscleGroup.HAMSTRINGS, Equipment.BARBELL, false),
            new Seed("Leg Curl", ExerciseCategory.STRENGTH, MuscleGroup.HAMSTRINGS, Equipment.MACHINE, false),
            new Seed("Good Morning", ExerciseCategory.STRENGTH, MuscleGroup.HAMSTRINGS, Equipment.BARBELL, false),
            new Seed("Nordic Hamstring Curl", ExerciseCategory.STRENGTH, MuscleGroup.HAMSTRINGS, Equipment.BODYWEIGHT, true),

            new Seed("Barbell Hip Thrust", ExerciseCategory.STRENGTH, MuscleGroup.GLUTES, Equipment.BARBELL, false),
            new Seed("Glute Bridge", ExerciseCategory.STRENGTH, MuscleGroup.GLUTES, Equipment.BODYWEIGHT, true),
            new Seed("Cable Kickback", ExerciseCategory.STRENGTH, MuscleGroup.GLUTES, Equipment.CABLE, false),

            new Seed("Standing Calf Raise", ExerciseCategory.STRENGTH, MuscleGroup.CALVES, Equipment.MACHINE, false),
            new Seed("Seated Calf Raise", ExerciseCategory.STRENGTH, MuscleGroup.CALVES, Equipment.MACHINE, false),

            new Seed("Plank", ExerciseCategory.STRENGTH, MuscleGroup.CORE, Equipment.BODYWEIGHT, true),
            new Seed("Hanging Leg Raise", ExerciseCategory.STRENGTH, MuscleGroup.CORE, Equipment.BODYWEIGHT, true),
            new Seed("Cable Crunch", ExerciseCategory.STRENGTH, MuscleGroup.CORE, Equipment.CABLE, false),
            new Seed("Russian Twist", ExerciseCategory.STRENGTH, MuscleGroup.CORE, Equipment.DUMBBELL, false),
            new Seed("Ab Wheel Rollout", ExerciseCategory.STRENGTH, MuscleGroup.CORE, Equipment.BODYWEIGHT, true),

            new Seed("Clean and Jerk", ExerciseCategory.OLYMPIC, MuscleGroup.FULL_BODY, Equipment.BARBELL, false),
            new Seed("Power Snatch", ExerciseCategory.OLYMPIC, MuscleGroup.FULL_BODY, Equipment.BARBELL, false),
            new Seed("Kettlebell Swing", ExerciseCategory.STRENGTH, MuscleGroup.FULL_BODY, Equipment.KETTLEBELL, false),
            new Seed("Farmer's Carry", ExerciseCategory.STRENGTH, MuscleGroup.FULL_BODY, Equipment.DUMBBELL, false),
            new Seed("Burpee", ExerciseCategory.PLYOMETRIC, MuscleGroup.FULL_BODY, Equipment.BODYWEIGHT, true),

            new Seed("Treadmill Run", ExerciseCategory.CARDIO, MuscleGroup.CARDIO, Equipment.MACHINE, false),
            new Seed("Stationary Bike", ExerciseCategory.CARDIO, MuscleGroup.CARDIO, Equipment.MACHINE, false),
            new Seed("Rowing Machine", ExerciseCategory.CARDIO, MuscleGroup.CARDIO, Equipment.MACHINE, false),
            new Seed("Stair Climber", ExerciseCategory.CARDIO, MuscleGroup.CARDIO, Equipment.MACHINE, false),
            new Seed("Jump Rope", ExerciseCategory.CARDIO, MuscleGroup.CARDIO, Equipment.BODYWEIGHT, false));

    private final ExerciseRepository exercises;

    public ExerciseCatalogSeeder(ExerciseRepository exercises) {
        this.exercises = exercises;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (exercises.existsByOwnerIsNull()) {
            return;
        }
        List<Exercise> entities = CATALOG.stream().map(seed -> {
            Exercise exercise = new Exercise();
            exercise.setName(seed.name());
            exercise.setCategory(seed.category());
            exercise.setPrimaryMuscle(seed.muscle());
            exercise.setEquipment(seed.equipment());
            exercise.setBodyweight(seed.bodyweight());
            exercise.setCustom(false);
            return exercise;
        }).toList();
        exercises.saveAll(entities);
        log.info("Seeded {} global exercises", entities.size());
    }
}
