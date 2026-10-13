import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { WeightUnit } from '../api/types';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { Field } from '../components/Field';
import { Spinner } from '../components/Spinner';
import { WEIGHT_UNITS } from '../lib/constants';

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('KG');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ displayName: displayName.trim(), email: email.trim(), password, unit });
      navigate('/', { replace: true });
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth__card">
        <div className="auth__card-head">
          <h1>Create your log</h1>
          <p>One account keeps your training history in sync across devices.</p>
        </div>

        <form className="auth__form" onSubmit={onSubmit} noValidate>
          {error ? <ErrorBanner error={error} onDismiss={() => setError(null)} /> : null}

          <Field label="Name" htmlFor="register-name">
            <input
              id="register-name"
              className="input"
              autoComplete="name"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Alex Carter"
            />
          </Field>

          <Field label="Email" htmlFor="register-email">
            <input
              id="register-email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" htmlFor="register-password" hint="At least 8 characters.">
            <input
              id="register-password"
              className="input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Preferred units" htmlFor="register-unit">
            <div className="segmented segmented--block" id="register-unit" role="group" aria-label="Preferred units">
              {WEIGHT_UNITS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={unit === option ? 'is-active' : ''}
                  aria-pressed={unit === option}
                  onClick={() => setUnit(option)}
                >
                  {option === 'KG' ? 'Kilograms' : 'Pounds'}
                </button>
              ))}
            </div>
          </Field>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? <Spinner className="btn__spinner" /> : null}
            Create account
          </button>
        </form>

        <div className="auth__foot">
          Already lifting here? <Link to="/login">Log in</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
