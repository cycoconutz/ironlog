import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { MuscleSlice, WeightUnit } from '../../api/types';
import { muscleLabel } from '../../lib/constants';
import { formatNumber, formatVolume, kgToUnit } from '../../lib/format';
import { CHART_ITEM_STYLE, CHART_LABEL_STYLE, CHART_TOOLTIP_STYLE, colorAt } from './palette';

export function MuscleChart({ data, unit }: { data: MuscleSlice[]; unit: WeightUnit }) {
  const slices = data
    .map((slice) => ({
      name: muscleLabel(slice.muscle),
      volume: slice.volumeKg == null ? 0 : kgToUnit(slice.volumeKg, unit),
      sets: slice.sets,
    }))
    .filter((slice) => slice.volume > 0)
    .sort((a, b) => b.volume - a.volume);

  const total = slices.reduce((sum, slice) => sum + slice.volume, 0);

  if (total <= 0) {
    return (
      <div className="chart-empty">
        No sets logged in the last 30 days.
        <br />
        Your muscle split shows up here.
      </div>
    );
  }

  return (
    <div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={228}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="volume"
              nameKey="name"
              innerRadius={62}
              outerRadius={94}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice, index) => (
                <Cell key={slice.name} fill={colorAt(index)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={CHART_LABEL_STYLE}
              itemStyle={CHART_ITEM_STYLE}
              formatter={(value: unknown) => [
                `${formatNumber(typeof value === 'number' ? value : Number(value), 0)} ${unit === 'LB' ? 'lb' : 'kg'}`,
                'Volume',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {slices.slice(0, 8).map((slice, index) => (
          <span className="chart-legend__item" key={slice.name}>
            <span
              className="chart-legend__dot"
              style={{ background: colorAt(index) }}
              aria-hidden="true"
            />
            {slice.name}
            <strong className="tabular">{Math.round((slice.volume / total) * 100)}%</strong>
          </span>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--fs-sm)' }}>
        Total volume {formatVolume(total, unit)} across {formatNumber(slices.reduce((s, x) => s + x.sets, 0))} sets.
      </p>
    </div>
  );
}
