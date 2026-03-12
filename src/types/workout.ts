export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
  isWarmup?: boolean;
  rpe?: number;
}

export interface Exercise {
  id: string;
  name: string;
  variant?: string; // "flat", "incline", etc.
  sets: ExerciseSet[];
  weightUnit: 'kg' | 'lb';
}

export interface Workout {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  label?: string; // "Push Day", "Pull Day", etc.
  exercises: Exercise[];
  notes?: string; // "felt weaker today"
  createdAt: string;
}

export interface DayData {
  date: string;
  intensity: 0 | 1 | 2 | 3; // 0=none, 1=light, 2=moderate, 3=full
  workout?: Workout;
}

export interface LiftTrend {
  name: string;
  currentWeight: number;
  unit: 'kg' | 'lb';
  delta: number; // change over period
  period: string; // "8w", "4w", etc.
  sparkline: number[]; // array of weights over time
}
