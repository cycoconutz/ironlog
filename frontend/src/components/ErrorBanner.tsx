import { errorMessage, isApiError } from '../api/client';
import { formatFieldName } from '../lib/format';
import { IconAlert, IconClose, IconCheck } from './icons';

export function ErrorBanner({ error, onDismiss }: { error: unknown; onDismiss?: () => void }) {
  if (!error) return null;
  const fieldErrors = isApiError(error) ? error.fieldErrors : undefined;
  const entries = fieldErrors ? Object.entries(fieldErrors) : [];
  return (
    <div className="banner" role="alert">
      <IconAlert size={18} />
      <div className="banner__flex">
        <div className="banner__title">{errorMessage(error)}</div>
        {entries.length > 0 ? (
          <div className="banner__fields">
            {entries.map(([field, message]) => (
              <div key={field}>
                <strong>{formatFieldName(field)}:</strong> {message}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {onDismiss ? (
        <button className="btn btn--quiet btn--icon" onClick={onDismiss} aria-label="Dismiss error" type="button">
          <IconClose size={16} />
        </button>
      ) : null}
    </div>
  );
}

export function SuccessBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="banner banner--success" role="status">
      <IconCheck size={18} />
      <div className="banner__flex">
        <div className="banner__title">{message}</div>
      </div>
      {onDismiss ? (
        <button className="btn btn--quiet btn--icon" onClick={onDismiss} aria-label="Dismiss message" type="button">
          <IconClose size={16} />
        </button>
      ) : null}
    </div>
  );
}
