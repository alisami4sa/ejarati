export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value" dir="ltr">
        {value}
      </p>
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
  );
}
