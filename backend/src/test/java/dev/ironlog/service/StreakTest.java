package dev.ironlog.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StreakTest {

    @Test
    void emptyHistoryHasNoStreak() {
        assertThat(StatsService.currentStreak(Set.of())).isZero();
        assertThat(StatsService.longestStreak(Set.of())).isZero();
    }

    @Test
    void consecutiveDaysUpToTodayCount() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Set<LocalDate> days = Set.of(today, today.minusDays(1), today.minusDays(2));
        assertThat(StatsService.currentStreak(days)).isEqualTo(3);
    }

    @Test
    void streakSurvivesTrainingYesterdayButNotBefore() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        assertThat(StatsService.currentStreak(Set.of(today.minusDays(1), today.minusDays(2)))).isEqualTo(2);
        assertThat(StatsService.currentStreak(Set.of(today.minusDays(2), today.minusDays(3)))).isZero();
    }

    @Test
    void longestStreakFindsLongestRun() {
        LocalDate base = LocalDate.of(2026, 1, 1);
        Set<LocalDate> days = Set.of(
                base, base.plusDays(1), base.plusDays(2),
                base.plusDays(5),
                base.plusDays(10), base.plusDays(11), base.plusDays(12), base.plusDays(13));
        assertThat(StatsService.longestStreak(days)).isEqualTo(4);
    }
}
