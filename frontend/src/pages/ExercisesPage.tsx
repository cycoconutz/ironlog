import { useState } from 'react';
import type { FormEvent } from 'react';
import { exercisesApi } from '../api/exercises';
import type {
  Equipment,
  ExerciseCategory,
  ExerciseRequest,
  ExerciseResponse,
  MuscleGroup,
} from '../api/types';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { Field } from '../components/Field';
import { IconExercises, IconPencil, IconPlus, IconTrash } from '../components/icons';
import { Modal, ConfirmDialog } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { Spinner } from '../components/Spinner';
import {
  CATEGORY_LABELS,
  EQUIPMENT,
  EQUIPMENT_LABELS,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  muscleLabel,
} from '../lib/constants';
import { formatNumber } from '../lib/format';
import { useAsyncData } from '../lib/useAsyncData';
import { useDebounced } from '../lib/useDebounced';

interface FormState {
  name: string;
  category: ExerciseCategory;
  primaryMuscle: MuscleGroup;
  equipment: Equipment;
  bodyweight: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'STRENGTH',
  primaryMuscle: 'CHEST',
  equipment: 'BARBELL',
  bodyweight: false,
};

export function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'' | ExerciseCategory>('');
  const [muscle, setMuscle] = useState<'' | MuscleGroup>('');
  const query = useDebounced(search, 250);

  const list = useAsyncData(
    (signal) =>
      exercisesApi.list(
        {
          q: query.trim() || undefined,
          category: category || undefined,
          muscle: muscle || undefined,
        },
        signal,
      ),
    [query, category, muscle],
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ExerciseResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (exercise: ExerciseResponse) => {
    setEditId(exercise.id);
    setForm({
      name: exercise.name,
      category: exercise.category,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      bodyweight: exercise.bodyweight,
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const patch = (next: Partial<FormState>) => setForm((current) => ({ ...current, ...next }));

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError(new Error('Give the exercise a name.'));
      return;
    }
    const payload: ExerciseRequest = {
      name: form.name.trim(),
      category: form.category,
      primaryMuscle: form.primaryMuscle,
      equipment: form.equipment,
      bodyweight: form.bodyweight,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editId) {
        await exercisesApi.update(editId, payload);
      } else {
        await exercisesApi.create(payload);
      }
      setEditorOpen(false);
      list.reload();
    } catch (cause) {
      setFormError(cause);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      await exercisesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      list.reload();
    } catch (cause) {
      setActionError(cause);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const items = list.data ?? [];
  const hasFilters = Boolean(query.trim() || category || muscle);

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="page-head">
        <div>
          <h1>Exercises</h1>
          <p className="page-head__sub">
            {list.loading ? 'Loading the catalog' : `${formatNumber(items.length)} movements available.`} Add
            your own custom movements when the catalog is missing something.
          </p>
        </div>
        <button className="btn btn--primary" onClick={openCreate} type="button">
          <IconPlus size={16} />
          New exercise
        </button>
      </div>

      {actionError ? <ErrorBanner error={actionError} onDismiss={() => setActionError(null)} /> : null}

      <div className="card">
        <div className="card__body">
          <div className="filter-bar">
            <div className="field field--search">
              <label className="field__label" htmlFor="ex-search">
                Search
              </label>
              <input
                id="ex-search"
                className="input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Bench, squat, row…"
              />
            </div>
            <Field label="Muscle" htmlFor="ex-muscle">
              <select
                id="ex-muscle"
                className="select"
                value={muscle}
                onChange={(event) => setMuscle(event.target.value as '' | MuscleGroup)}
              >
                <option value="">All muscles</option>
                {MUSCLE_GROUPS.map((option) => (
                  <option key={option} value={option}>
                    {muscleLabel(option)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category" htmlFor="ex-category">
              <select
                id="ex-category"
                className="select"
                value={category}
                onChange={(event) => setCategory(event.target.value as '' | ExerciseCategory)}
              >
                <option value="">All categories</option>
                {EXERCISE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {CATEGORY_LABELS[option]}
                  </option>
                ))}
              </select>
            </Field>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setSearch('');
                setCategory('');
                setMuscle('');
              }}
              disabled={!hasFilters}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {list.error ? <ErrorBanner error={list.error} onDismiss={list.reload} /> : null}

      {list.loading ? (
        <div className="ex-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="ex-card" key={index}>
              <Skeleton width="70%" height={20} />
              <Skeleton width="100%" height={16} />
              <Skeleton width="50%" height={16} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconExercises size={22} />}
          title={hasFilters ? 'No exercises match those filters' : 'No exercises yet'}
          description={
            hasFilters
              ? 'Try a different search or clear the filters.'
              : 'Create a custom exercise to start building your catalog.'
          }
          action={
            hasFilters ? (
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setMuscle('');
                }}
                type="button"
              >
                Clear filters
              </button>
            ) : (
              <button className="btn btn--primary" onClick={openCreate} type="button">
                New exercise
              </button>
            )
          }
        />
      ) : (
        <div className="ex-grid">
          {items.map((exercise) => (
            <div className="ex-card" key={exercise.id}>
              <div>
                <div className="ex-card__name">{exercise.name}</div>
                <div className="row" style={{ marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge--steel">{muscleLabel(exercise.primaryMuscle)}</span>
                  {exercise.custom ? <span className="badge badge--ember">Custom</span> : null}
                  {exercise.bodyweight ? <span className="badge badge--muted">Bodyweight</span> : null}
                </div>
              </div>
              <div className="ex-card__tags">
                <span className="badge">{CATEGORY_LABELS[exercise.category]}</span>
                <span className="badge">{EQUIPMENT_LABELS[exercise.equipment]}</span>
              </div>
              <div className="ex-card__foot">
                {exercise.custom ? (
                  <>
                    <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                      Yours
                    </span>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        className="btn btn--quiet btn--icon"
                        onClick={() => openEdit(exercise)}
                        aria-label={`Edit ${exercise.name}`}
                        type="button"
                      >
                        <IconPencil size={16} />
                      </button>
                      <button
                        className="btn btn--quiet btn--icon"
                        onClick={() => setDeleteTarget(exercise)}
                        aria-label={`Delete ${exercise.name}`}
                        type="button"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                    Catalog movement
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editId ? 'Edit exercise' : 'New exercise'}
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setEditorOpen(false)} disabled={saving} type="button">
              Cancel
            </button>
            <button className="btn btn--primary" onClick={onSave} disabled={saving} type="button">
              {saving ? <Spinner className="btn__spinner" /> : null}
              {editId ? 'Save changes' : 'Create exercise'}
            </button>
          </>
        }
      >
        <form className="stack" onSubmit={onSave}>
          {formError ? <ErrorBanner error={formError} /> : null}
          <Field label="Name" htmlFor="ex-name">
            <input
              id="ex-name"
              className="input"
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="Incline dumbbell press"
              maxLength={120}
              autoFocus
            />
          </Field>
          <Field label="Primary muscle" htmlFor="ex-form-muscle">
            <select
              id="ex-form-muscle"
              className="select"
              value={form.primaryMuscle}
              onChange={(event) => patch({ primaryMuscle: event.target.value as MuscleGroup })}
            >
              {MUSCLE_GROUPS.map((option) => (
                <option key={option} value={option}>
                  {muscleLabel(option)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" htmlFor="ex-form-category">
            <select
              id="ex-form-category"
              className="select"
              value={form.category}
              onChange={(event) => patch({ category: event.target.value as ExerciseCategory })}
            >
              {EXERCISE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Equipment" htmlFor="ex-form-equipment">
            <select
              id="ex-form-equipment"
              className="select"
              value={form.equipment}
              onChange={(event) => patch({ equipment: event.target.value as Equipment })}
            >
              {EQUIPMENT.map((option) => (
                <option key={option} value={option}>
                  {EQUIPMENT_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>
          <label className="row" style={{ gap: 'var(--space-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.bodyweight}
              onChange={(event) => patch({ bodyweight: event.target.checked })}
            />
            <span>Bodyweight movement</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this exercise?"
        message={`“${deleteTarget?.name ?? 'This exercise'}” will be removed from your catalog. Sessions that already logged it keep their history.`}
        confirmLabel={deleting ? 'Deleting' : 'Delete exercise'}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
