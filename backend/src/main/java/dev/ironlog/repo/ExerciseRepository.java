package dev.ironlog.repo;

import dev.ironlog.domain.Exercise;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    @Query("""
            select e from Exercise e
            where e.owner is null or e.owner.id = :userId
            order by e.name asc
            """)
    List<Exercise> findVisibleTo(@Param("userId") UUID userId);

    Optional<Exercise> findByOwnerIsNullAndNameIgnoreCase(String name);

    boolean existsByOwnerIdAndNameIgnoreCase(UUID ownerId, String name);

    boolean existsByOwnerIsNull();
}
