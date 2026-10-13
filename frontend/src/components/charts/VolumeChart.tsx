import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { VolumePoint, WeightUnit } from '../../api/types';
import { formatNumber, formatShortDate, kgToUnit, unitLabel } from '../../lib/format';
import { CHART_AXIS_TICK, CHART_ITEM_STYLE, CHART_LABEL_STYLE, CHART_TOOLTIP_STYLE } from './palette';

export function VolumeChart({ data, unit }: { data: VolumePoint[]; unit: WeightUnit }) {
  const rows = data.map((point) => ({
    label: formatShortDate(point.periodStart),
    volume: point.volumeKg == null ? 0 : Math.round(kgToUnit(point.volumeKg, unit) * 10) / 10,
  }));

  if (!rows.some((row) => row.volume > 0)) {
    return (
      <div className="chart-empty">
        No training volume in this window yet.
        <br />
        Log a session and your weekly volume lands here.
      </div>
    );
  }

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={264}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5a1f" stopOpacity={0.48} />
              <stop offset="100%" stopColor="#ff5a1f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e222a" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={CHART_AXIS_TICK}
            interval="preserveStartEnd"
            minTickGap={18}
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
            cursor={{ stroke: '#343a45' }}
            formatter={(value: unknown) => [
              `${formatNumber(typeof value === 'number' ? value : Number(value), 1)} ${unitLabel(unit)}`,
              'Volume',
            ]}
          />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="#ff7d47"
            strokeWidth={2}
            fill="url(#volumeFill)"
            activeDot={{ r: 4, fill: '#ff7d47', stroke: '#180a03', strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
