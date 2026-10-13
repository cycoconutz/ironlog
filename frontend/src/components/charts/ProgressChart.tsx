import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ExerciseHistoryPoint, WeightUnit } from '../../api/types';
import { formatNumber, formatShortDate, kgToUnit, unitLabel } from '../../lib/format';
import { CHART_AXIS_TICK, CHART_ITEM_STYLE, CHART_LABEL_STYLE, CHART_TOOLTIP_STYLE } from './palette';

const SERIES_NAMES: Record<string, string> = {
  topWeightKg: 'Top set',
  estimated1rmKg: 'Est. 1RM',
};

export function ProgressChart({
  data,
  unit,
}: {
  data: ExerciseHistoryPoint[];
  unit: WeightUnit;
}) {
  const rows = data
    .map((point) => ({
      label: formatShortDate(point.date),
      topWeightKg:
        point.topWeightKg == null ? null : Math.round(kgToUnit(point.topWeightKg, unit) * 10) / 10,
      estimated1rmKg:
        point.estimated1rmKg == null
          ? null
          : Math.round(kgToUnit(point.estimated1rmKg, unit) * 10) / 10,
    }))
    .filter((row) => row.topWeightKg !== null || row.estimated1rmKg !== null);

  if (rows.length < 2) {
    return (
      <div className="chart-empty">Log this exercise on at least two days to see a progress line.</div>
    );
  }

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={rows} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#1e222a" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={CHART_AXIS_TICK}
            minTickGap={20}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={54}
            tick={CHART_AXIS_TICK}
            tickFormatter={(value: unknown) =>
              formatNumber(typeof value === 'number' ? value : Number(value), 0)
            }
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelStyle={CHART_LABEL_STYLE}
            itemStyle={CHART_ITEM_STYLE}
            formatter={(value: unknown, name: unknown) => {
              const key = typeof name === 'string' ? name : '';
              return [
                `${formatNumber(typeof value === 'number' ? value : Number(value), 1)} ${unitLabel(unit)}`,
                SERIES_NAMES[key] ?? key,
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="topWeightKg"
            stroke="#5b8db8"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="estimated1rmKg"
            stroke="#ff7d47"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
