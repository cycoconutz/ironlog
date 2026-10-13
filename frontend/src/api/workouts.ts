import { apiRequest } from './client';
import type { PageResponse, WorkoutQuery, WorkoutRequest, WorkoutResponse, WorkoutSummary } from './types';

export const workoutsApi = {
  list(query: WorkoutQuery = {}, signal?: AbortSignal) {
    return apiRequest<PageResponse<WorkoutSummary>>('/api/workouts', {
      query: { page: query.page, size: query.size, from: query.from, to: query.to },
      signal,
    });
  },
  get(id: string, signal?: AbortSignal) {
    return apiRequest<WorkoutResponse>(`/api/workouts/${id}`, { signal });
  },
  create(body: WorkoutRequest) {
    return apiRequest<WorkoutResponse>('/api/workouts', { method: 'POST', body });
  },
  update(id: string, body: WorkoutRequest) {
    return apiRequest<WorkoutResponse>(`/api/workouts/${id}`, { method: 'PUT', body });
  },
  remove(id: string) {
    return apiRequest<void>(`/api/workouts/${id}`, { method: 'DELETE' });
  },
};
