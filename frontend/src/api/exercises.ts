import { apiRequest } from './client';
import type { ExerciseQuery, ExerciseRequest, ExerciseResponse } from './types';

export const exercisesApi = {
  list(query: ExerciseQuery = {}, signal?: AbortSignal) {
    return apiRequest<ExerciseResponse[]>('/api/exercises', {
      query: { category: query.category, muscle: query.muscle, q: query.q },
      signal,
    });
  },
  get(id: string) {
    return apiRequest<ExerciseResponse>(`/api/exercises/${id}`);
  },
  create(body: ExerciseRequest) {
    return apiRequest<ExerciseResponse>('/api/exercises', { method: 'POST', body });
  },
  update(id: string, body: ExerciseRequest) {
    return apiRequest<ExerciseResponse>(`/api/exercises/${id}`, { method: 'PUT', body });
  },
  remove(id: string) {
    return apiRequest<void>(`/api/exercises/${id}`, { method: 'DELETE' });
  },
};
