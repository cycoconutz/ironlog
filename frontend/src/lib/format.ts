import type { WeightUnit } from '../api/types';

export const KG_PER_LB = 0.45359237;

export function kgToUnit(kg: number, unit: WeightUnit): number {
  return unit === 'LB' ? kg / KG_PER_LB : kg;
}

export function unitToKg(value: number, unit: WeightUnit): number {
  return unit === 'LB' ? value * KG_PER_LB : value;
}

export function unitLabel(unit: WeightUnit): string {
  return unit === 'LB' ? 'lb' : 'kg';
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (!isNumber(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Convert a stored kilogram value into the user's unit and format just the number. */
export function formatWeightValue(
  kg: number | null | undefined,
  unit: WeightUnit,
  decimals = 1,
): string {
  if (!isNumber(kg)) return '—';
  return formatNumber(kgToUnit(kg, unit), decimals);
}

/** e.g. "102.5 kg" */
export function formatWeight(kg: number | null | undefined, unit: WeightUnit, decimals = 1): string {
  if (!isNumber(kg)) return '—';
  return `${formatWeightValue(kg, unit, decimals)} ${unitLabel(unit)}`;
}

/** Volumes get large, so drop the decimal once we cross 1000. */
export function formatVolume(kg: number | null | undefined, unit: WeightUnit): string {
  if (!isNumber(kg)) return '—';
  const value = kgToUnit(kg, unit);
  const decimals = Math.abs(value) >= 1000 ? 0 : 1;
  return `${formatNumber(value, decimals)} ${unitLabel(unit)}`;
}

export function formatDistance(meters: number | null | undefined): string {
  if (!isNumber(meters)) return '—';
  if (meters >= 1000) return `${formatNumber(meters / 1000, 2)} km`;
  return `${formatNumber(meters, 0)} m`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!isNumber(seconds) || seconds <= 0) return '—';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const DAY_MS = 86_400_000;

/** "Today", "Yesterday", "3 days ago", or an absolute date after a week. */
export function relativeDay(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / DAY_MS);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return formatDate(value);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** ISO instant -> value suitable for an <input type="datetime-local"> in local time. */
export function isoToLocalInput(value: string | null | undefined): string {
  const date = parseDate(value) ?? new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** <input type="datetime-local"> value -> ISO instant, or null when empty. */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Parse a user-typed numeric field into a number or null (empty/invalid). */
export function parseNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Parse a user-typed integer field into an integer or null. */
export function parseIntegerOrNull(value: string): number | null {
  const parsed = parseNumberOrNull(value);
  return parsed === null ? null : Math.round(parsed);
}

export function formatFieldName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._]/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase());
}
