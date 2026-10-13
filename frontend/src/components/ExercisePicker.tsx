import { useEffect, useRef, useState } from 'react';
import { exercisesApi } from '../api/exercises';
import type { ExerciseResponse } from '../api/types';
import { CATEGORY_LABELS, EQUIPMENT_LABELS, muscleLabel } from '../lib/constants';
import { IconSearch } from './icons';
import { Spinner } from './Spinner';

export function ExercisePicker({ onSelect }: { onSelect: (exercise: ExerciseResponse) => void }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ExerciseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      setLoading(true);
      exercisesApi
        .list({ q: query.trim() || undefined }, controller.signal)
        .then((result) => {
          setItems(result);
          setError(null);
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === 'AbortError') return;
          setError('Could not load exercises.');
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (exercise: ExerciseResponse) => {
    onSelect(exercise);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && items[activeIndex]) {
        event.preventDefault();
        choose(items[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="picker" ref={rootRef}>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          style={{ paddingLeft: 38 }}
          placeholder="Search exercises to add"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search exercises"
          role="combobox"
          aria-expanded={open}
          aria-controls="exercise-picker-list"
        />
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            display: 'inline-flex',
            color: 'var(--text-mute)',
          }}
          aria-hidden="true"
        >
          <IconSearch size={17} />
        </span>
      </div>

      {open ? (
        <div className="picker__results" id="exercise-picker-list" role="listbox">
          {loading && items.length === 0 ? (
            <div className="picker__empty">
              <Spinner /> Loading exercises
            </div>
          ) : error ? (
            <div className="picker__empty">{error}</div>
          ) : items.length === 0 ? (
            <div className="picker__empty">
              No exercises match “{query}”. Create a custom one on the Exercises page.
            </div>
          ) : (
            items.slice(0, 60).map((exercise, index) => (
              <button
                key={exercise.id}
                type="button"
                className="picker__item"
                data-active={index === activeIndex}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(exercise)}
              >
                <span className="truncate">
                  {exercise.name}
                  {exercise.custom ? <span className="badge badge--ember" style={{ marginLeft: 8 }}>Custom</span> : null}
                </span>
                <small className="nowrap">
                  {muscleLabel(exercise.primaryMuscle)} · {CATEGORY_LABELS[exercise.category]} ·{' '}
                  {EQUIPMENT_LABELS[exercise.equipment]}
                </small>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
