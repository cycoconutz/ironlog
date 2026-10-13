import { useAuth } from '../auth/AuthContext';
import { WEIGHT_UNITS } from '../lib/constants';

export function UnitToggle() {
  const { user, setUnit } = useAuth();
  if (!user) return null;
  return (
    <div className="segmented segmented--block" role="group" aria-label="Weight unit">
      {WEIGHT_UNITS.map((unit) => (
        <button
          key={unit}
          type="button"
          className={user.unit === unit ? 'is-active' : ''}
          aria-pressed={user.unit === unit}
          onClick={() => {
            void setUnit(unit);
          }}
        >
          {unit}
        </button>
      ))}
    </div>
  );
}
