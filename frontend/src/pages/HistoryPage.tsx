import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workoutsApi } from '../api/workouts';
import type { WorkoutSummary } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { IconHistory, IconLog } from '../components/icons';
import { SessionRow } from '../components/SessionRow';
import { Skeleton } from '../components/Skeleton';
import { Spinner } from '../components/Spinner';
import { formatNumber } from '../lib/format';

const PAGE_SIZE = 20;

export function HistoryPage() {
  const { user } = useAuth();
  const unit = user?.unit ?? 'KG';

  const [items, setItems] = useState<WorkoutSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await workoutsApi.list({ page: 0, size: PAGE_SIZE });
      setItems(result.items);
      setTotal(result.totalItems);
      setPage(result.page);
      setHasNext(result.hasNext);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    setError(null);
    try {
      const result = await workoutsApi.list({ page: page + 1, size: PAGE_SIZE });
      setItems((previous) => [...previous, ...result.items]);
      setPage(result.page);
      setHasNext(result.hasNext);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p className="page-head__sub">
            {loading ? 'Loading your sessions' : `${formatNumber(total)} sessions logged.`}
          </p>
        </div>
        <Link className="btn btn--primary" to="/log">
          <IconLog size={16} />
          Log a session
        </Link>
      </div>

      {error && items.length === 0 ? <ErrorBanner error={error} /> : null}

      {loading ? (
        <div className="card">
          <div className="card__body stack">
            <Skeleton width="100%" height={64} />
            <Skeleton width="100%" height={64} />
            <Skeleton width="100%" height={64} />
            <Skeleton width="100%" height={64} />
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconHistory size={22} />}
          title="No sessions logged yet"
          description="Every session you log builds your history, volume trend, and streak."
          action={
            <Link className="btn btn--primary" to="/log">
              Log your first session
            </Link>
          }
        />
      ) : (
        <>
          <div className="card">
            <div className="card__body card__body--flush">
              <div className="session-list">
                {items.map((workout) => (
                  <SessionRow key={workout.id} workout={workout} unit={unit} />
                ))}
              </div>
            </div>
          </div>
          {error ? <ErrorBanner error={error} /> : null}
          {hasNext ? (
            <div className="load-more">
              <button className="btn btn--ghost" onClick={loadMore} disabled={loadingMore} type="button">
                {loadingMore ? <Spinner className="btn__spinner" /> : null}
                Load more sessions
              </button>
            </div>
          ) : (
            <p className="muted" style={{ textAlign: 'center', paddingTop: 'var(--space-4)' }}>
              That is the whole log. {formatNumber(total)} sessions.
            </p>
          )}
        </>
      )}
    </div>
  );
}
