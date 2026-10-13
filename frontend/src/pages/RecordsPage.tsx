import { Fragment, useState } from 'react';
import { statsApi } from '../api/stats';
import type { PersonalRecord, WeightUnit } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { IconChevronRight, IconRecords } from '../components/icons';
import { Skeleton } from '../components/Skeleton';
import { ProgressChart } from '../components/charts/ProgressChart';
import { muscleLabel } from '../lib/constants';
import { formatDate, formatNumber, formatWeight } from '../lib/format';
import { useAsyncData } from '../lib/useAsyncData';

function RecordProgress({ exerciseId, unit }: { exerciseId: string; unit: WeightUnit }) {
  const progress = useAsyncData(
    (signal) => statsApi.exerciseProgress(exerciseId, 365, signal),
    [exerciseId],
  );

  return (
    <div className="records__progress">
      <div className="records__progress-head">
        <h3>{progress.data?.exerciseName ?? 'Progress'}</h3>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          {progress.data?.currentBest1rmKg != null ? (
            <span className="badge badge--steel">
              Now {formatWeight(progress.data.currentBest1rmKg, unit)}
            </span>
          ) : null}
          {progress.data?.allTimeBest1rmKg != null ? (
            <span className="badge badge--ember">
              All-time {formatWeight(progress.data.allTimeBest1rmKg, unit)}
            </span>
          ) : null}
        </div>
      </div>
      {progress.loading ? (
        <Skeleton width="100%" height={240} />
      ) : progress.error ? (
        <ErrorBanner error={progress.error} />
      ) : (
        <ProgressChart data={progress.data?.history ?? []} unit={unit} />
      )}
    </div>
  );
}

export function RecordsPage() {
  const { user } = useAuth();
  const unit = user?.unit ?? 'KG';
  const records = useAsyncData((signal) => statsApi.records(signal), []);
  const [openId, setOpenId] = useState<string | null>(null);

  const items = records.data ?? [];

  const toggle = (record: PersonalRecord) => {
    setOpenId((current) => (current === record.exerciseId ? null : record.exerciseId));
  };

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="page-head">
        <div>
          <h1>Records</h1>
          <p className="page-head__sub">
            Your best weights, estimated one-rep maxes, and heavy set volumes. Tap any row to see the trend.
          </p>
        </div>
      </div>

      {records.error ? <ErrorBanner error={records.error} onDismiss={records.reload} /> : null}

      {records.loading ? (
        <div className="card">
          <div className="card__body stack">
            <Skeleton width="100%" height={44} />
            <Skeleton width="100%" height={44} />
            <Skeleton width="100%" height={44} />
            <Skeleton width="100%" height={44} />
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconRecords size={22} />}
          title="No personal records yet"
          description="Log a few sessions and your best lifts will be tracked here automatically."
        />
      ) : (
        <div className="card">
          <div className="card__body card__body--flush">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th className="num">Best weight</th>
                    <th className="num">Reps</th>
                    <th className="num">Est. 1RM</th>
                    <th className="num">Best set vol.</th>
                    <th>Achieved</th>
                    <th className="num">Times</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((record) => {
                    const open = openId === record.exerciseId;
                    return (
                      <Fragment key={record.exerciseId}>
                        <tr
                          className={`is-clickable${open ? ' is-open' : ''}`}
                          onClick={() => toggle(record)}
                        >
                          <td>
                            <div className="row" style={{ gap: 'var(--space-3)', minWidth: 0 }}>
                              <span className="truncate" style={{ fontWeight: 600 }}>
                                {record.exerciseName}
                              </span>
                              <span className="badge badge--steel nowrap">
                                {muscleLabel(record.primaryMuscle)}
                              </span>
                            </div>
                          </td>
                          <td className="num tabular">{formatWeight(record.bestWeightKg, unit)}</td>
                          <td className="num tabular">{record.bestWeightReps ?? '—'}</td>
                          <td className="num tabular">{formatWeight(record.best1rmKg, unit)}</td>
                          <td className="num tabular">{formatWeight(record.bestSetVolumeKg, unit)}</td>
                          <td className="nowrap">{record.achievedOn ? formatDate(record.achievedOn) : '—'}</td>
                          <td className="num tabular">{formatNumber(record.timesPerformed)}</td>
                          <td style={{ width: 44 }}>
                            <button
                              className="record-toggle"
                              type="button"
                              aria-label={open ? 'Hide progress' : 'Show progress'}
                              aria-expanded={open}
                            >
                              <IconChevronRight size={15} />
                            </button>
                          </td>
                        </tr>
                        {open ? (
                          <tr>
                            <td colSpan={8} style={{ padding: 0 }}>
                              <RecordProgress exerciseId={record.exerciseId} unit={unit} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
