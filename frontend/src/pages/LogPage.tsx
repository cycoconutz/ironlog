import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { workoutsApi } from '../api/workouts';
import type {
  ExerciseResponse,
  MuscleGroup,
  SetType,
  WorkoutRequest,
  WorkoutStatus,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorBanner } from '../components/ErrorBanner';
import { ExercisePicker } from '../components/ExercisePicker';
import { Field } from '../components/Field';
import { IconAlert, IconArrowLeft, IconCheck, IconPlus, IconTrash } from '../components/icons';
import { Skeleton } from '../components/Skeleton';
import { Spinner } from '../components/Spinner';
import {
  SET_TYPES,
  SET_TYPE_COLORS,
  SET_TYPE_LABELS,
  WORKOUT_STATUSES,
  WORKOUT_STATUS_LABELS,
  muscleLabel,
} from '../lib/constants';
import {
  formatVolume,
  isoToLocalInput,
  kgToUnit,
  localInputToIso,
  parseIntegerOrNull,
  parseNumberOrNull,
  round,
  unitLabel,
  unitToKg,
} from '../lib/format';

interface DraftSet {
  key: string;
  reps: string;
  weight: string;
  rpe: string;
  type: SetType;
}

interface DraftExercise {
  key: string;
  exerciseId: string;
  name: string;
  primaryMuscle: MuscleGroup;
  notes: string;
  sets: DraftSet[];
}

let sequence = 0;
function nextKey(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

function emptySet(): DraftSet {
  return { key: nextKey('set'), reps: '', weight: '', rpe: '', type: 'NORMAL' };
}

function draftFromExercise(exercise: ExerciseResponse): DraftExercise {
  return {
    key: nextKey('ex'),
    exerciseId: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    notes: '',
    sets: [emptySet()],
  };
}

export function LogPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const unit = user?.unit ?? 'KG';
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [startedAt, setStartedAt] = useState(() => isoToLocalInput(null));
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState<WorkoutStatus>('COMPLETED');
  const [notes, setNotes] = useState('');
  const [draft, setDraft] = useState<DraftExercise[]>([]);

  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    workoutsApi
      .get(id)
      .then((workout) => {
        if (cancelled) return;
        setTitle(workout.title ?? '');
        setStartedAt(isoToLocalInput(workout.startedAt));
        setDuration(workout.durationSeconds > 0 ? String(Math.round(workout.durationSeconds / 60)) : '');
        setStatus(workout.status);
        setNotes(workout.notes ?? '');
        setDraft(
          workout.exercises.map((entry) => ({
            key: nextKey('ex'),
            exerciseId: entry.exerciseId,
            name: entry.exerciseName,
            primaryMuscle: entry.primaryMuscle,
            notes: entry.notes ?? '',
            sets:
              entry.sets.length > 0
                ? entry.sets.map((set) => ({
                    key: nextKey('set'),
                    reps: set.reps == null ? '' : String(set.reps),
                    weight: set.weightKg == null ? '' : String(round(kgToUnit(set.weightKg, unit), 2)),
                    rpe: set.rpe == null ? '' : String(set.rpe),
                    type: set.type,
                  }))
                : [emptySet()],
          })),
        );
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setLoadError(cause);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addExercise = (exercise: ExerciseResponse) => {
    setDraft((previous) => [...previous, draftFromExercise(exercise)]);
  };

  const patchExercise = (key: string, patch: Partial<DraftExercise>) => {
    setDraft((previous) => previous.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeExercise = (key: string) => {
    setDraft((previous) => previous.filter((item) => item.key !== key));
  };

  const addSet = (key: string) => {
    setDraft((previous) =>
      previous.map((item) => (item.key === key ? { ...item, sets: [...item.sets, emptySet()] } : item)),
    );
  };

  const patchSet = (exerciseKey: string, setKey: string, patch: Partial<DraftSet>) => {
    setDraft((previous) =>
      previous.map((item) =>
        item.key === exerciseKey
          ? { ...item, sets: item.sets.map((set) => (set.key === setKey ? { ...set, ...patch } : set)) }
          : item,
      ),
    );
  };

  const removeSet = (exerciseKey: string, setKey: string) => {
    setDraft((previous) =>
      previous.map((item) =>
        item.key === exerciseKey
          ? { ...item, sets: item.sets.filter((set) => set.key !== setKey) }
          : item,
      ),
    );
  };

  const totals = useMemo(() => {
    let sets = 0;
    let volumeKg = 0;
    for (const exercise of draft) {
      for (const set of exercise.sets) {
        const reps = parseIntegerOrNull(set.reps);
        const weight = parseNumberOrNull(set.weight);
        if (reps == null && weight == null) continue;
        sets += 1;
        if (reps != null && weight != null) volumeKg += unitToKg(weight, unit) * reps;
      }
    }
    return { exercises: draft.length, sets, volumeKg };
  }, [draft, unit]);

  const onSubmit = async () => {
    setValidationError(null);
    setSaveError(null);

    const exercises = draft
      .map((exercise) => ({
        exerciseId: exercise.exerciseId,
        notes: exercise.notes.trim() || null,
        sets: exercise.sets
          .filter((set) => set.reps.trim() || set.weight.trim() || set.rpe.trim())
          .map((set) => {
            const weight = parseNumberOrNull(set.weight);
            return {
              reps: parseIntegerOrNull(set.reps),
              weightKg: weight == null ? null : round(unitToKg(weight, unit), 2),
              durationSeconds: null,
              distanceMeters: null,
              rpe: parseIntegerOrNull(set.rpe),
              type: set.type,
            };
          }),
      }))
      .filter((exercise) => exercise.sets.length > 0);

    if (exercises.length === 0) {
      setValidationError('Add at least one exercise with at least one set before saving.');
      return;
    }

    const startedIso = localInputToIso(startedAt) ?? new Date().toISOString();
    const minutes = parseIntegerOrNull(duration);
    const completedAt =
      status === 'COMPLETED'
        ? minutes != null && minutes > 0
          ? new Date(new Date(startedIso).getTime() + minutes * 60_000).toISOString()
          : startedIso
        : null;
    const payload: WorkoutRequest = {
      title: title.trim() || null,
      startedAt: startedIso,
      completedAt,
      notes: notes.trim() || null,
      status,
      exercises,
    };

    setSaving(true);
    try {
      const saved =
        isEditing && id
          ? await workoutsApi.update(id, payload)
          : await workoutsApi.create(payload);
      navigate(`/history/${saved.id}`);
    } catch (cause) {
      setSaveError(cause);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="builder">
        <Skeleton width={200} height={36} />
        <Skeleton width="100%" height={150} />
        <Skeleton width="100%" height={220} />
      </div>
    );
  }

  return (
    <div className="builder">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <Link className="btn btn--quiet btn--sm" to={isEditing && id ? `/history/${id}` : '/history'} style={{ marginBottom: 'var(--space-3)', marginLeft: -10 }}>
            <IconArrowLeft size={16} />
            {isEditing ? 'Back to session' : 'Back to history'}
          </Link>
          <h1>{isEditing ? 'Edit session' : 'Log a session'}</h1>
          <p className="page-head__sub">
            Add exercises, record each set, and save. Weights are entered in {unitLabel(unit)} and stored
            in kilograms.
          </p>
        </div>
      </div>

      {loadError ? <ErrorBanner error={loadError} /> : null}
      {saveError ? <ErrorBanner error={saveError} onDismiss={() => setSaveError(null)} /> : null}
      {validationError ? (
        <div className="banner" role="alert">
          <IconAlert size={18} />
          <div className="banner__flex">
            <div className="banner__title">{validationError}</div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card__body">
          <div className="builder__meta">
            <Field label="Session title" htmlFor="session-title" className="field--wide">
              <input
                id="session-title"
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Push day, Legs, Deadlift singles…"
                maxLength={120}
              />
            </Field>
            <Field label="Date and time" htmlFor="session-date">
              <input
                id="session-date"
                className="input"
                type="datetime-local"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="session-status">
              <select
                id="session-status"
                className="select"
                value={status}
                onChange={(event) => setStatus(event.target.value as WorkoutStatus)}
              >
                {WORKOUT_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {WORKOUT_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duration (min)" htmlFor="session-duration">
              <input
                id="session-duration"
                className="input"
                type="number"
                min={0}
                max={1440}
                inputMode="numeric"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="60"
                disabled={status !== 'COMPLETED'}
              />
            </Field>
            <Field label="Notes" htmlFor="session-notes" className="builder__notes">
              <textarea
                id="session-notes"
                className="textarea"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="How did it feel? Anything to remember for next time."
                maxLength={2000}
              />
            </Field>
          </div>
        </div>
      </div>

      {draft.length === 0 ? (
        <div className="muted-box">No exercises yet. Add your first movement below.</div>
      ) : (
        draft.map((exercise) => (
          <div className="exercise-editor" key={exercise.key}>
            <div className="exercise-editor__head">
              <div className="exercise-editor__title">
                <span
                  className="set-type-dot"
                  style={{ background: 'var(--ember)', width: 9, height: 9 }}
                  aria-hidden="true"
                />
                <b className="truncate">{exercise.name}</b>
                <span className="badge badge--steel nowrap">{muscleLabel(exercise.primaryMuscle)}</span>
              </div>
              <button
                className="btn btn--quiet btn--icon"
                onClick={() => removeExercise(exercise.key)}
                aria-label={`Remove ${exercise.name}`}
                type="button"
              >
                <IconTrash size={16} />
              </button>
            </div>

            <div className="exercise-editor__notes">
              <input
                className="input"
                value={exercise.notes}
                onChange={(event) => patchExercise(exercise.key, { notes: event.target.value })}
                placeholder="Notes for this exercise (optional)"
                maxLength={500}
                aria-label={`${exercise.name} notes`}
              />
            </div>

            <div className="table-wrap">
              <table className="set-table">
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>Reps</th>
                    <th>Weight ({unitLabel(unit)})</th>
                    <th>RPE</th>
                    <th>Type</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, index) => (
                    <tr key={set.key}>
                      <td>
                        <span className="set-num" style={{ borderColor: SET_TYPE_COLORS[set.type] }}>
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <input
                          className="input input--num"
                          type="number"
                          min={0}
                          max={1000}
                          value={set.reps}
                          onChange={(event) =>
                            patchSet(exercise.key, set.key, { reps: event.target.value })
                          }
                          aria-label={`Set ${index + 1} reps`}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          className="input input--num"
                          type="number"
                          min={0}
                          step={0.5}
                          value={set.weight}
                          onChange={(event) =>
                            patchSet(exercise.key, set.key, { weight: event.target.value })
                          }
                          aria-label={`Set ${index + 1} weight in ${unitLabel(unit)}`}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          className="input input--num"
                          type="number"
                          min={1}
                          max={10}
                          value={set.rpe}
                          onChange={(event) =>
                            patchSet(exercise.key, set.key, { rpe: event.target.value })
                          }
                          aria-label={`Set ${index + 1} RPE`}
                          placeholder="—"
                        />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={set.type}
                          onChange={(event) =>
                            patchSet(exercise.key, set.key, { type: event.target.value as SetType })
                          }
                          aria-label={`Set ${index + 1} type`}
                        >
                          {SET_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {SET_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn--quiet btn--icon"
                          onClick={() => removeSet(exercise.key, set.key)}
                          disabled={exercise.sets.length === 1}
                          aria-label={`Remove set ${index + 1}`}
                          type="button"
                        >
                          <IconTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="exercise-editor__foot">
              <button className="btn btn--ghost btn--sm" onClick={() => addSet(exercise.key)} type="button">
                <IconPlus size={15} />
                Add set
              </button>
              <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                {exercise.sets.length} {exercise.sets.length === 1 ? 'set' : 'sets'}
              </span>
            </div>
          </div>
        ))
      )}

      <div className="add-exercise">
        <div className="section-head" style={{ marginBottom: 'var(--space-4)' }}>
          <span className="section-head__title">Add an exercise</span>
        </div>
        <ExercisePicker onSelect={addExercise} />
        <p className="muted" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--fs-sm)' }}>
          Search the catalog or your custom movements, then click to add. Need something new? Create a
          custom exercise on the <Link to="/exercises" style={{ color: 'var(--ember-bright)' }}>Exercises</Link> page.
        </p>
      </div>

      <div className="action-bar">
        <div className="action-bar__inner">
          <div className="action-bar__totals">
            <div>
              <b className="tabular">{draft.length}</b>
              <span>Exercises</span>
            </div>
            <div>
              <b className="tabular">{totals.sets}</b>
              <span>Sets</span>
            </div>
            <div>
              <b className="tabular">{formatVolume(totals.volumeKg, unit)}</b>
              <span>Est. volume</span>
            </div>
          </div>
          <div className="row">
            <Link className="btn btn--ghost" to={isEditing && id ? `/history/${id}` : '/history'}>
              Cancel
            </Link>
            <button className="btn btn--primary" onClick={onSubmit} disabled={saving} type="button">
              {saving ? <Spinner className="btn__spinner" /> : <IconCheck size={16} />}
              {isEditing ? 'Save changes' : 'Save session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
