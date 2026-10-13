export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo" aria-label="IronLog">
      <span className="logo__mark" aria-hidden="true">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M7 7v10M17 7v10M4 10v4M20 10v4M7 12h10" />
        </svg>
      </span>
      {!compact && (
        <span className="logo__word">
          Iron<b>Log</b>
        </span>
      )}
    </span>
  );
}
