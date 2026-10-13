import { Link } from 'react-router-dom';
import { statsApi } from '../api/stats';
import { workoutsApi } from '../api/workouts';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconLog } from '../components/icons';
import { MetricCard } from '../components/MetricCard';
import { SessionRow } from '../components/SessionRow';
import { Skeleton } from '../components/Skeleton';
import { MuscleChart } from '../components/charts/MuscleChart';
import { VolumeChart } from '../components/charts/VolumeChart';
import { formatNumber, kgToUnit, unitLabel } from '../lib/format';
import { useAsyncData } from '../lib/useAsyncData';

function MetricSkeleton() {
  return (
    <div className="metric">
      <Skeleton width="58%" height={11} />
      <div style={{ height: 12 }} />
      <Skeleton width="42%" height={30} />
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const unit = user?.unit ?? 'KG';

  const summary = useAsyncData((signal) => statsApi.summary(signal), []);
  const volume = useAsyncData((signal) => statsApi.volume(12, signal), []);
  const muscles = useAsyncData((signal) => statsApi.muscles(30, signal), []);
  const recent = useAsyncData((signal) => workoutsApi.list({ page: 0, size: 5 }, signal), []);

  const data = summary.data;
  const firstName = user?.displayName?.trim().split(/\s+/)[0];

  return (
    <div className="dash">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="page-head__sub">
            {firstName ? `Welcome back, ${firstName}. ` : ''}Here is where your training stands.
          </p>
        </div>
        <Link className="btn btn--primary" to="/log">
          <IconLog size={16} />
          Log a session
        </Link>
      </div>

      {summary.error ? <ErrorBanner error={summary.error} /> : null}

      <div className="metrics">
        {summary.loading || !data ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <MetricCard label="Total workouts" value={formatNumber(data.totalWorkouts)} />
            <MetricCard
              label="This week"
              value={formatNumber(data.workoutsThisWeek)}
              hint={`${formatNumber(data.totalSets)} sets all time`}
            />
            <MetricCard
              label="Current streak"
              value={formatNumber(data.currentStreakDays)}
              unit="days"
              hint={data.currentStreakDays > 0 ? 'Keep it going' : 'Train today to start one'}
            />
            <MetricCard
              label="Longest streak"
              value={formatNumber(data.longestStreakDays)}
              unit="days"
            />
            <MetricCard
              label="Total volume"
              value={formatNumber(kgToUnit(data.totalVolumeKg ?? 0, unit), 0)}
              unit={unitLabel(unit)}
              hint={`${formatNumber(data.totalReps)} reps logged`}
            />
            <MetricCard
              label="Total sets"
              value={formatNumber(data.totalSets)}
              hint={`${data.averageVolumePerWorkoutKg != null ? formatNumber(kgToUnit(data.averageVolumePerWorkoutKg, unit), 0) : '0'} ${unitLabel(unit)} avg / workout`}
            />
          </>
        )}
      </div>

      <div className="charts">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Weekly volume</div>
              <div className="card__sub">
                Last 12 weeks, kilograms converted to {unitLabel(unit)}
              </div>
            </div>
          </div>
          <div className="card__body">
            {volume.loading ? (
              <Skeleton width="100%" height={264} />
            ) : volume.error ? (
              <ErrorBanner error={volume.error} />
            ) : (
              <VolumeChart data={volume.data ?? []} unit={unit} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Muscle split</div>
              <div className="card__sub">Volume by muscle, last 30 days</div>
            </div>
          </div>
          <div className="card__body">
            {muscles.loading ? (
              <Skeleton width="100%" height={228} />
            ) : muscles.error ? (
              <ErrorBanner error={muscles.error} />
            ) : (
              <MuscleChart data={muscles.data ?? []} unit={unit} />
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div className="card__title">Recent sessions</div>
          <Link className="btn btn--quiet btn--sm" to="/history">
            View all
          </Link>
        </div>
        <div className="card__body card__body--flush">
          {recent.loading ? (
            <div className="stack" style={{ padding: 'var(--space-5)' }}>
              <Skeleton width="100%" height={56} />
              <Skeleton width="100%" height={56} />
              <Skeleton width="100%" height={56} />
            </div>
          ) : recent.error ? (
            <div style={{ padding: 'var(--space-5)' }}>
              <ErrorBanner error={recent.error} />
            </div>
          ) : recent.data && recent.data.items.length > 0 ? (
            <div className="session-list">
              {recent.data.items.map((workout) => (
                <SessionRow key={workout.id} workout={workout} unit={unit} />
              ))}
            </div>
          ) : (
            <div style={{ padding: 'var(--space-5)' }}>
              <EmptyState
                icon={<IconLog size={22} />}
                title="No sessions yet"
                description="Your logged workouts, volume, and streaks all start with one entry."
                action={
                  <Link className="btn btn--primary" to="/log">
                    Log your first session
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
