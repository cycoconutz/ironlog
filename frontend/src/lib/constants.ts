import type {
  ExerciseCategory,
  Equipment,
  MuscleGroup,
  SetType,
  WeightUnit,
  WorkoutStatus,
} from '../api/types';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'CORE',
  'FULL_BODY',
  'CARDIO',
  'OTHER',
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  CORE: 'Core',
  FULL_BODY: 'Full body',
  CARDIO: 'Cardio',
  OTHER: 'Other',
};

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'STRENGTH',
  'CARDIO',
  'MOBILITY',
  'PLYOMETRIC',
  'OLYMPIC',
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  STRENGTH: 'Strength',
  CARDIO: 'Cardio',
  MOBILITY: 'Mobility',
  PLYOMETRIC: 'Plyometric',
  OLYMPIC: 'Olympic',
};

export const EQUIPMENT: Equipment[] = [
  'BARBELL',
  'EZ_BAR',
  'DUMBBELL',
  'KETTLEBELL',
  'MACHINE',
  'SMITH_MACHINE',
  'CABLE',
  'BODYWEIGHT',
  'BAND',
  'OTHER',
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  BARBELL: 'Barbell',
  EZ_BAR: 'EZ bar',
  DUMBBELL: 'Dumbbell',
  KETTLEBELL: 'Kettlebell',
  MACHINE: 'Machine',
  SMITH_MACHINE: 'Smith machine',
  CABLE: 'Cable',
  BODYWEIGHT: 'Bodyweight',
  BAND: 'Band',
  OTHER: 'Other',
};

export const SET_TYPES: SetType[] = ['NORMAL', 'WARMUP', 'DROP', 'FAILURE', 'AMRAP'];

export const SET_TYPE_LABELS: Record<SetType, string> = {
  NORMAL: 'Normal',
  WARMUP: 'Warm-up',
  DROP: 'Drop',
  FAILURE: 'Failure',
  AMRAP: 'AMRAP',
};

export const WORKOUT_STATUSES: WorkoutStatus[] = ['COMPLETED', 'IN_PROGRESS'];

export const WORKOUT_STATUS_LABELS: Record<WorkoutStatus, string> = {
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export const SET_TYPE_COLORS: Record<SetType, string> = {
  NORMAL: '#6e7787',
  WARMUP: '#5b8db8',
  DROP: '#f5a623',
  FAILURE: '#ff6262',
  AMRAP: '#37d99a',
};

export const WEIGHT_UNITS: WeightUnit[] = ['KG', 'LB'];

export function muscleLabel(muscle: MuscleGroup): string {
  return MUSCLE_LABELS[muscle] ?? muscle;
}
