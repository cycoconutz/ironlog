package dev.ironlog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@BatchSize(size = 50)
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 16)
    private ExerciseCategory category = ExerciseCategory.STRENGTH;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_muscle", nullable = false, length = 16)
    private MuscleGroup primaryMuscle;

    @Enumerated(EnumType.STRING)
    @Column(name = "equipment", nullable = false, length = 16)
    private Equipment equipment = Equipment.OTHER;

    /** True when the movement is unloaded (push-ups), so volume is rep-based. */
    @Column(name = "bodyweight", nullable = false)
    private boolean bodyweight;

    /** Null owner means the exercise is part of the shared global catalog. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "custom", nullable = false)
    private boolean custom;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @jakarta.persistence.PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
