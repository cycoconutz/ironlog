import { apiRequest } from './client';
import type {
  ExerciseProgress,
  MuscleSlice,
  PersonalRecord,
  StatsSummary,
  VolumePoint,
} from './types';

export const statsApi = {
  summary(signal?: AbortSignal) {
    return apiRequest<StatsSummary>('/api/stats/summary', { signal });
  },
  volume(weeks: number, signal?: AbortSignal) {
    return apiRequest<VolumePoint[]>('/api/stats/volume', { query: { weeks }, signal });
  },
  muscles(days: number, signal?: AbortSignal) {
    return apiRequest<MuscleSlice[]>('/api/stats/muscles', { query: { days }, signal });
  },
  records(signal?: AbortSignal) {
    return apiRequest<PersonalRecord[]>('/api/stats/records', { signal });
  },
  exerciseProgress(exerciseId: string, days: number, signal?: AbortSignal) {
    return apiRequest<ExerciseProgress>(`/api/stats/exercises/${exerciseId}`, {
      query: { days },
      signal,
    });
  },
};
