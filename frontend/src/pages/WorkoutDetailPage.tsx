import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { workoutsApi } from '../api/workouts';
import type { SetResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  IconArrowLeft,
  IconClock,
  IconExercises,
  IconPencil,
  IconTrash,
} from '../components/icons';
import { MetricCard } from '../components/MetricCard';
import { ConfirmDialog } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { SET_TYPE_COLORS, SET_TYPE_LABELS, WORKOUT_STATUS_LABELS, muscleLabel } from '../lib/constants';
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  formatNumber,
  formatWeight,
  formatVolume,
  unitLabel,
} from '../lib/format';
import { useAsyncData } from '../lib/useAsyncData';

function SetRow({ set, unit }: { set: SetResponse; unit: 'KG' | 'LB' }) {
  return (
    <tr>
      <td>{set.position}</td>
      <td>
        <span
          className="set-type-dot"
          style={{ background: SET_TYPE_COLORS[set.type] }}
          aria-hidden="true"
        />
        {SET_TYPE_LABELS[set.type]}
      </td>
      <td className="num tabular">{set.reps ?? '—'}</td>
      <td className="num tabular">{formatWeight(set.weightKg, unit)}</td>
      <td className="num tabular">{set.rpe ?? '—'}</td>
    </tr>
  );
}

export function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const unit = user?.unit ?? 'KG';
  const navigate = useNavigate();

  const { data, loading, error } = useAsyncData(
    (signal) => workoutsApi.get(id ?? '', signal),
    [id],
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setActionError(null);
    try {
      await workoutsApi.remove(id);
      navigate('/history', { replace: true });
    } catch (cause) {
      setActionError(cause);
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="detail">
        <Skeleton width={220} height={40} />
        <div className="detail__stats">
          <Skeleton width="100%" height={88} />
          <Skeleton width="100%" height={88} />
          <Skeleton width="100%" height={88} />
          <Skeleton width="100%" height={88} />
        </div>
        <Skeleton width="100%" height={200} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stack">
        <Link className="btn btn--quiet btn--sm" to="/history">
          <IconArrowLeft size={16} />
          Back to history
        </Link>
        <ErrorBanner error={error ?? new Error('That workout could not be found.')} />
      </div>
    );
  }

  const title = data.title?.trim() || 'Untitled session';

  return (
    <div className="detail">
      <div>
        <Link className="btn btn--quiet btn--sm" to="/history" style={{ marginBottom: 'var(--space-4)' }}>
          <IconArrowLeft size={16} />
          Back to history
        </Link>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div>
            <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 6 }}>
              <h1>{title}</h1>
              <span
                className={`badge ${data.status === 'COMPLETED' ? 'badge--ok' : 'badge--warn'}`}
              >
                {WORKOUT_STATUS_LABELS[data.status]}
              </span>
            </div>
            <p className="page-head__sub">
              {formatDateTime(data.startedAt)}
              {data.durationSeconds > 0 ? ` · ${formatDuration(data.durationSeconds)}` : ''}
            </p>
          </div>
          <div className="row">
            <Link className="btn btn--ghost" to={`/log/${data.id}`}>
              <IconPencil size={16} />
              Edit
            </Link>
            <button className="btn btn--danger" onClick={() => setConfirmOpen(true)} type="button">
              <IconTrash size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {actionError ? <ErrorBanner error={actionError} onDismiss={() => setActionError(null)} /> : null}

      <div className="detail__stats">
        <MetricCard label="Volume" value={formatVolume(data.totalVolumeKg, unit)} />
        <MetricCard label="Sets" value={formatNumber(data.setCount)} />
        <MetricCard label="Exercises" value={formatNumber(data.exerciseCount)} />
        <MetricCard
          label="Duration"
          value={formatDuration(data.durationSeconds)}
          hint={data.totalDistanceMeters ? formatDistance(data.totalDistanceMeters) : undefined}
        />
      </div>

      {data.notes ? (
        <div className="card">
          <div className="card__head">
            <div className="card__title">Session notes</div>
          </div>
          <div className="card__body">
            <p className="dim" style={{ whiteSpace: 'pre-wrap' }}>
              {data.notes}
            </p>
          </div>
        </div>
      ) : null}

      <div className="stack">
        {data.exercises.length === 0 ? (
          <div className="muted-box">This session has no exercises recorded.</div>
        ) : (
          data.exercises.map((exercise) => (
            <div className="exercise-block" key={exercise.id}>
              <div className="exercise-block__head">
                <div className="row" style={{ gap: 'var(--space-3)', minWidth: 0 }}>
                  <span className="exercise-block__name truncate">{exercise.exerciseName}</span>
                  <span className="badge badge--steel">{muscleLabel(exercise.primaryMuscle)}</span>
                </div>
                <span className="badge badge--muted nowrap">
                  <IconExercises size={13} /> {formatVolume(exercise.volumeKg, unit)}
                </span>
              </div>
              {exercise.notes ? <div className="exercise-block__notes">{exercise.notes}</div> : null}
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 64 }}>Set</th>
                      <th>Type</th>
                      <th className="num">Reps</th>
                      <th className="num">Weight ({unitLabel(unit)})</th>
                      <th className="num">RPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set) => (
                      <SetRow key={set.id} set={set} unit={unit} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="muted row" style={{ fontSize: 'var(--fs-sm)', gap: 6 }}>
        <IconClock size={14} />
        Started {formatDateTime(data.startedAt)}
        {data.completedAt ? ` · Finished ${formatDateTime(data.completedAt)}` : ''}
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this session?"
        message={`“${title}” and every set inside it will be removed. This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting' : 'Delete session'}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
