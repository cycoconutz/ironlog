import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { ErrorBanner } from '../components/ErrorBanner';
import { Field } from '../components/Field';
import { Spinner } from '../components/Spinner';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
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
          <h1>Welcome back</h1>
          <p>Log in to pick up where your last session left off.</p>
        </div>

        <form className="auth__form" onSubmit={onSubmit} noValidate>
          {error ? <ErrorBanner error={error} onDismiss={() => setError(null)} /> : null}

          <Field label="Email" htmlFor="login-email">
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" htmlFor="login-password">
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? <Spinner className="btn__spinner" /> : null}
            Log in
          </button>
        </form>

        <div className="auth__foot">
          New to IronLog? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
