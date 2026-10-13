package dev.ironlog.repo;

import dev.ironlog.domain.Workout;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkoutRepository extends JpaRepository<Workout, UUID> {

    Optional<Workout> findByIdAndUserId(UUID id, UUID userId);

    Page<Workout> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    Page<Workout> findByUserIdAndStartedAtBetweenOrderByStartedAtDesc(UUID userId, Instant from, Instant to, Pageable pageable);

    List<Workout> findByUserIdOrderByStartedAtDesc(UUID userId);

    List<Workout> findByUserIdAndStartedAtGreaterThanEqualOrderByStartedAtAsc(UUID userId, Instant from);

    long countByUserId(UUID userId);

    long countByUserIdAndStartedAtGreaterThanEqual(UUID userId, Instant from);

    /** Per-workout roll-up used to build list summaries without an N+1 storm. */
    interface WorkoutAggregate {
        UUID getId();

        long getExerciseCount();

        long getSetCount();

        BigDecimal getVolumeKg();

        BigDecimal getDistanceMeters();
    }

    @Query("""
            select w.id as id,
                   count(distinct we.id) as exerciseCount,
                   count(s.id) as setCount,
                   coalesce(sum(s.weightKg * s.reps), 0) as volumeKg,
                   coalesce(sum(s.distanceMeters), 0) as distanceMeters
            from Workout w
            left join w.exercises we
            left join we.sets s
            where w.id in :ids and w.user.id = :userId
            group by w.id
            """)
    List<WorkoutAggregate> aggregateByIds(@Param("ids") List<UUID> ids, @Param("userId") UUID userId);

    /** True when any workout references this exercise (blocks orphan-making deletes). */
    @Query("select count(we) from WorkoutExercise we where we.exercise.id = :exerciseId")
    long countUsagesOfExercise(@Param("exerciseId") UUID exerciseId);
}
