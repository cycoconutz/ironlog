export function MetricCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">
        <b>{value}</b>
        {unit ? <span>{unit}</span> : null}
      </div>
      {hint ? <div className="metric__hint">{hint}</div> : null}
    </div>
  );
}
