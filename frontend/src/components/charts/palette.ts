export const CHART_COLORS = [
  '#ff5a1f',
  '#ff8a4c',
  '#f5a623',
  '#5b8db8',
  '#8fb6d8',
  '#c98b3a',
  '#e0674a',
  '#7aa6cc',
  '#9c7a55',
  '#6e7787',
  '#545c6a',
  '#3d444f',
  '#2c313a',
  '#22262e',
];

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export const CHART_TOOLTIP_STYLE = {
  background: '#14171c',
  border: '1px solid #343a45',
  borderRadius: 9,
  padding: '10px 12px',
  boxShadow: '0 18px 40px -20px rgba(0,0,0,0.9)',
  fontSize: 13,
} as const;

export const CHART_LABEL_STYLE = { color: '#eef1f5', fontWeight: 600, marginBottom: 4 } as const;
export const CHART_ITEM_STYLE = { color: '#a8b0bd' } as const;
export const CHART_AXIS_TICK = { fill: '#6e7787', fontSize: 12 } as const;
