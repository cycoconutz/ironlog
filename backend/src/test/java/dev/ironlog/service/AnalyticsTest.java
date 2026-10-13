package dev.ironlog.service;

import static org.assertj.core.api.Assertions.assertThat;

import dev.ironlog.domain.SetEntry;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AnalyticsTest {

    @Test
    void volumeIsWeightTimesReps() {
        SetEntry set = new SetEntry();
        set.setWeightKg(new BigDecimal("100"));
        set.setReps(5);
        assertThat(Analytics.volumeKg(set)).isEqualByComparingTo("500");
    }

    @Test
    void bodyweightSetHasNoWeightVolume() {
        SetEntry set = new SetEntry();
        set.setReps(20);
        assertThat(Analytics.volumeKg(set)).isEqualByComparingTo("0");
    }

    @Test
    void singleRepOneRepMaxEqualsWeight() {
        SetEntry set = new SetEntry();
        set.setWeightKg(new BigDecimal("140"));
        set.setReps(1);
        assertThat(Analytics.estimatedOneRepMaxKg(set)).isEqualByComparingTo("140");
    }

    @Test
    void epleyEstimateGrowsWithReps() {
        SetEntry fiveReps = new SetEntry();
        fiveReps.setWeightKg(new BigDecimal("100"));
        fiveReps.setReps(5);

        SetEntry threeReps = new SetEntry();
        threeReps.setWeightKg(new BigDecimal("100"));
        threeReps.setReps(3);

        assertThat(Analytics.estimatedOneRepMaxKg(fiveReps))
                .isGreaterThan(Analytics.estimatedOneRepMaxKg(threeReps));
        // 100 * (1 + 5/30) = 116.67
        assertThat(Analytics.estimatedOneRepMaxKg(fiveReps)).isEqualByComparingTo("116.67");
    }
}
