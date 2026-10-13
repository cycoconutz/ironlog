package dev.ironlog.repo;

import dev.ironlog.domain.SetEntry;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SetEntryRepository extends JpaRepository<SetEntry, UUID> {

    @Query("""
            select s from SetEntry s
            join fetch s.workoutExercise we
            join fetch we.workout w
            join fetch we.exercise e
            where w.user.id = :userId and w.startedAt >= :since
            order by w.startedAt asc, we.position asc, s.position asc
            """)
    List<SetEntry> findForStats(@Param("userId") UUID userId, @Param("since") Instant since);
}
