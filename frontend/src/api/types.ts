export type WeightUnit = 'KG' | 'LB';

export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'FOREARMS'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES'
  | 'CORE'
  | 'FULL_BODY'
  | 'CARDIO'
  | 'OTHER';

export type ExerciseCategory =
  | 'STRENGTH'
  | 'CARDIO'
  | 'MOBILITY'
  | 'PLYOMETRIC'
  | 'OLYMPIC';

export type Equipment =
  | 'BARBELL'
  | 'EZ_BAR'
  | 'DUMBBELL'
  | 'KETTLEBELL'
  | 'MACHINE'
  | 'SMITH_MACHINE'
  | 'CABLE'
  | 'BODYWEIGHT'
  | 'BAND'
  | 'OTHER';

export type SetType = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE' | 'AMRAP';

export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED';

/* Auth */

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  unit: WeightUnit;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserResponse;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  unit?: WeightUnit;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  unit: WeightUnit;
}

/* Exercises */

export interface ExerciseResponse {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscle: MuscleGroup;
  equipment: Equipment;
  bodyweight: boolean;
  custom: boolean;
}

export interface ExerciseRequest {
  name: string;
  category: ExerciseCategory;
  primaryMuscle: MuscleGroup;
  equipment: Equipment;
  bodyweight?: boolean;
}

export interface ExerciseQuery {
  category?: ExerciseCategory;
  muscle?: MuscleGroup;
  q?: string;
}

/* Workouts */

export interface SetRequest {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  type: SetType;
}

export interface WorkoutExerciseRequest {
  exerciseId: string;
  notes: string | null;
  sets: SetRequest[];
}

export interface WorkoutRequest {
  title: string | null;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  status: WorkoutStatus;
  exercises: WorkoutExerciseRequest[];
}

export interface SetResponse {
  id: string;
  position: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  type: SetType;
}

export interface WorkoutExerciseResponse {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  position: number;
  notes: string | null;
  volumeKg: number | null;
  sets: SetResponse[];
}

export interface WorkoutResponse {
  id: string;
  title: string | null;
  startedAt: string;
  completedAt: string | null;
  status: WorkoutStatus;
  notes: string | null;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number | null;
  totalDistanceMeters: number | null;
  durationSeconds: number;
  exercises: WorkoutExerciseResponse[];
}

export interface WorkoutSummary {
  id: string;
  title: string | null;
  startedAt: string;
  completedAt: string | null;
  status: WorkoutStatus;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number | null;
  totalDistanceMeters: number | null;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface WorkoutQuery {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
}

/* Stats */

export interface StatsSummary {
  totalWorkouts: number;
  workoutsThisWeek: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number | null;
  currentStreakDays: number;
  longestStreakDays: number;
  totalDurationMinutes: number;
  averageVolumePerWorkoutKg: number | null;
}

export interface VolumePoint {
  periodStart: string;
  volumeKg: number | null;
  workouts: number;
  sets: number;
}

export interface MuscleSlice {
  muscle: MuscleGroup;
  volumeKg: number | null;
  sets: number;
  reps: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  bestWeightKg: number | null;
  bestWeightReps: number | null;
  best1rmKg: number | null;
  bestSetVolumeKg: number | null;
  achievedOn: string | null;
  timesPerformed: number;
}

export interface ExerciseHistoryPoint {
  date: string;
  topWeightKg: number | null;
  volumeKg: number | null;
  estimated1rmKg: number | null;
  sets: number;
  reps: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  currentBest1rmKg: number | null;
  allTimeBest1rmKg: number | null;
  unit: string;
  history: ExerciseHistoryPoint[];
}

/* Errors */

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}
