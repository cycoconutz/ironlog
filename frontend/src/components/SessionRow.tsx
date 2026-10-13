import { Link } from 'react-router-dom';
import type { WeightUnit, WorkoutSummary } from '../api/types';
import { formatNumber, formatVolume, formatTime, relativeDay } from '../lib/format';

function DateBadge({ iso }: { iso: string }) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return <span className="muted">—</span>;
  return (
    <div className="session-row__date">
      <b>{date.getDate()}</b>
      <span>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
    </div>
  );
}

export function SessionRow({ workout, unit }: { workout: WorkoutSummary; unit: WeightUnit }) {
  const title = workout.title?.trim() || 'Untitled session';
  return (
    <Link className="session-row" to={`/history/${workout.id}`}>
      <DateBadge iso={workout.startedAt} />
      <div className="session-row__mid">
        <div className="session-row__title truncate">{title}</div>
        <div className="session-row__meta">
          <span>{relativeDay(workout.startedAt)}</span>
          <span>{formatTime(workout.startedAt)}</span>
          <span>
            {workout.exerciseCount} {workout.exerciseCount === 1 ? 'exercise' : 'exercises'}
          </span>
          {workout.status === 'IN_PROGRESS' ? <span className="badge badge--warn">In progress</span> : null}
        </div>
      </div>
      <div className="session-row__stats">
        <div>
          <b className="tabular">{formatVolume(workout.totalVolumeKg, unit)}</b>
          <span>Volume</span>
        </div>
        <div>
          <b className="tabular">{formatNumber(workout.setCount)}</b>
          <span>Sets</span>
        </div>
      </div>
    </Link>
  );
}
