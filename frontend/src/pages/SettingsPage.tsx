import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WeightUnit } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorBanner, SuccessBanner } from '../components/ErrorBanner';
import { Field } from '../components/Field';
import { IconLogout } from '../components/icons';
import { Spinner } from '../components/Spinner';
import { WEIGHT_UNITS } from '../lib/constants';
import { formatDate } from '../lib/format';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [unit, setUnit] = useState<WeightUnit>(user?.unit ?? 'KG');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setUnit(user.unit);
    }
  }, [user]);

  const savedName = user?.displayName ?? '';
  const savedUnit = user?.unit ?? 'KG';
  const dirty = displayName.trim() !== savedName || unit !== savedUnit;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    setError(null);
    if (!displayName.trim()) {
      setError(new Error('Display name cannot be empty.'));
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim(), unit });
      setSuccess('Profile saved.');
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="page-head__sub">Your display name and preferred weight unit.</p>
        </div>
      </div>

      <div className="settings">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Profile</div>
              <div className="card__sub">This is how IronLog addresses you and shows weights.</div>
            </div>
          </div>
          <div className="card__body">
            <form className="settings__form" onSubmit={onSubmit} noValidate>
              {error ? <ErrorBanner error={error} onDismiss={() => setError(null)} /> : null}
              {success ? <SuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

              <div className="settings__identity">
                <span className="avatar" aria-hidden="true">
                  {initials(displayName || savedName || '?')}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>{displayName.trim() || savedName || 'Athlete'}</div>
                  <div className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              <Field label="Display name" htmlFor="settings-name">
                <input
                  id="settings-name"
                  className="input"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={120}
                  placeholder="Your name"
                />
              </Field>

              <Field
                label="Weight unit"
                hint="Weights are always stored in kilograms; this only changes how they display."
              >
                <div className="segmented" role="group" aria-label="Weight unit">
                  {WEIGHT_UNITS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={unit === option ? 'is-active' : ''}
                      aria-pressed={unit === option}
                      onClick={() => setUnit(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="row">
                <button className="btn btn--primary" type="submit" disabled={saving || !dirty}>
                  {saving ? <Spinner className="btn__spinner" /> : null}
                  Save changes
                </button>
                {dirty ? <span className="muted">Unsaved changes</span> : null}
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Account</div>
          </div>
          <div className="card__body">
            <dl className="settings__list">
              <div>
                <dt>Email</dt>
                <dd className="truncate">{user?.email ?? '—'}</dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{user ? formatDate(user.createdAt) : '—'}</dd>
              </div>
              <div>
                <dt>Unit</dt>
                <dd>{unit === 'LB' ? 'Pounds (lb)' : 'Kilograms (kg)'}</dd>
              </div>
            </dl>
            <button className="btn btn--ghost btn--block" onClick={handleLogout} type="button">
              <IconLogout size={17} />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
