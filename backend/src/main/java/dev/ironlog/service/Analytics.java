package dev.ironlog.service;

import dev.ironlog.domain.SetEntry;
import java.math.BigDecimal;
import java.math.RoundingMode;

/** Shared fitness math so volume and 1RM estimates stay consistent everywhere. */
public final class Analytics {

    private Analytics() {
    }

    /** Load moved: weight x reps. Bodyweight or timed sets contribute zero. */
    public static BigDecimal volumeKg(SetEntry set) {
        if (set.getWeightKg() == null || set.getReps() == null || set.getReps() <= 0) {
            return BigDecimal.ZERO;
        }
        return set.getWeightKg().multiply(BigDecimal.valueOf(set.getReps()));
    }

    /**
     * Epley estimate of a one-rep max: w * (1 + reps / 30). A single rep is
     * returned as-is since the formula only adds noise there.
     */
    public static BigDecimal estimatedOneRepMaxKg(SetEntry set) {
        if (set.getWeightKg() == null || set.getWeightKg().signum() <= 0 || set.getReps() == null || set.getReps() <= 0) {
            return BigDecimal.ZERO;
        }
        if (set.getReps() == 1) {
            return set.getWeightKg();
        }
        BigDecimal factor = BigDecimal.valueOf(1).add(
                BigDecimal.valueOf(set.getReps()).divide(BigDecimal.valueOf(30), 6, RoundingMode.HALF_UP));
        return set.getWeightKg().multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }
}
