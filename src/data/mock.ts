import { Workout, DayData, LiftTrend } from '../types/workout';

export const mockWorkouts: Workout[] = [
  {
    id: '1',
    date: '2026-03-12',
    label: 'Push Day',
    notes: 'Felt weaker today, slept 5 hours',
    exercises: [
      {
        id: 'e1',
        name: 'Bench Press',
        variant: 'flat',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 8, weight: 185 },
          { setNumber: 2, reps: 8, weight: 185 },
          { setNumber: 3, reps: 7, weight: 185 },
        ],
      },
      {
        id: 'e2',
        name: 'Incline DB Press',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 10, weight: 60 },
          { setNumber: 2, reps: 10, weight: 60 },
          { setNumber: 3, reps: 8, weight: 60 },
        ],
      },
      {
        id: 'e3',
        name: 'Cable Fly',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 12, weight: 25 },
          { setNumber: 2, reps: 12, weight: 25 },
          { setNumber: 3, reps: 11, weight: 25 },
        ],
      },
    ],
    createdAt: '2026-03-12T18:00:00Z',
  },
  {
    id: '2',
    date: '2026-03-10',
    label: 'Pull Day',
    exercises: [
      {
        id: 'e4',
        name: 'Barbell Row',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 8, weight: 135 },
          { setNumber: 2, reps: 8, weight: 135 },
          { setNumber: 3, reps: 8, weight: 135 },
        ],
      },
      {
        id: 'e5',
        name: 'Pull-ups',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 10, weight: 0 },
          { setNumber: 2, reps: 8, weight: 0 },
          { setNumber: 3, reps: 7, weight: 0 },
        ],
      },
    ],
    createdAt: '2026-03-10T17:30:00Z',
  },
  {
    id: '3',
    date: '2026-03-08',
    label: 'Leg Day',
    exercises: [
      {
        id: 'e6',
        name: 'Squat',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 5, weight: 275 },
          { setNumber: 2, reps: 5, weight: 275 },
          { setNumber: 3, reps: 5, weight: 275 },
        ],
      },
      {
        id: 'e7',
        name: 'RDL',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 8, weight: 225 },
          { setNumber: 2, reps: 8, weight: 225 },
          { setNumber: 3, reps: 8, weight: 225 },
        ],
      },
    ],
    createdAt: '2026-03-08T16:00:00Z',
  },
  {
    id: '4',
    date: '2026-03-06',
    label: 'Push Day',
    exercises: [
      {
        id: 'e8',
        name: 'Bench Press',
        variant: 'flat',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 8, weight: 185 },
          { setNumber: 2, reps: 8, weight: 185 },
          { setNumber: 3, reps: 8, weight: 185 },
        ],
      },
    ],
    createdAt: '2026-03-06T17:00:00Z',
  },
  {
    id: '5',
    date: '2026-03-04',
    label: 'Pull Day',
    exercises: [
      {
        id: 'e9',
        name: 'Barbell Row',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 8, weight: 130 },
          { setNumber: 2, reps: 8, weight: 130 },
          { setNumber: 3, reps: 7, weight: 130 },
        ],
      },
    ],
    createdAt: '2026-03-04T17:00:00Z',
  },
  {
    id: '6',
    date: '2026-03-02',
    label: 'Leg Day',
    exercises: [
      {
        id: 'e10',
        name: 'Squat',
        weightUnit: 'lb',
        sets: [
          { setNumber: 1, reps: 5, weight: 265 },
          { setNumber: 2, reps: 5, weight: 265 },
          { setNumber: 3, reps: 5, weight: 265 },
        ],
      },
    ],
    createdAt: '2026-03-02T16:00:00Z',
  },
];

export function generateHeatmapData(): DayData[] {
  const days: DayData[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const workoutDates = new Set(mockWorkouts.map((w) => w.date));

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const workout = mockWorkouts.find((w) => w.date === date);
    let intensity: 0 | 1 | 2 | 3 = 0;
    if (workout) {
      const exerciseCount = workout.exercises.length;
      if (exerciseCount >= 3) intensity = 3;
      else if (exerciseCount >= 2) intensity = 2;
      else intensity = 1;
    }
    days.push({ date, intensity, workout });
  }

  return days;
}

export const mockTrends: LiftTrend[] = [
  {
    name: 'Bench',
    currentWeight: 185,
    unit: 'lb',
    delta: 22,
    period: '8w',
    sparkline: [135, 145, 155, 160, 165, 175, 180, 185],
  },
  {
    name: 'Squat',
    currentWeight: 275,
    unit: 'lb',
    delta: 35,
    period: '8w',
    sparkline: [225, 235, 245, 250, 255, 265, 270, 275],
  },
  {
    name: 'Row',
    currentWeight: 135,
    unit: 'lb',
    delta: 15,
    period: '8w',
    sparkline: [115, 115, 120, 120, 125, 130, 130, 135],
  },
];
