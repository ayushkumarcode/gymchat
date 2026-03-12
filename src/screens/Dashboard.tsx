import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, fontSize } from '../utils/theme';
import { Workout, Exercise, DayData, LiftTrend } from '../types/workout';
import { loadWorkouts, saveWorkouts, loadSettings, AppSettings } from '../utils/storage';
import Heatmap from '../components/Heatmap';
import WorkoutTable from '../components/WorkoutTable';
import TrendRow from '../components/TrendRow';
import FAB from '../components/FAB';
import SettingsSheet from '../components/SettingsSheet';
import AIOverlay from '../components/AIOverlay';

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function computeHeatmapData(workouts: Workout[], year: number, month: number): DayData[] {
  const days: DayData[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const workout = workouts.find((w) => w.date === date);
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

function getMonthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function computeStats(workouts: Workout[]) {
  const today = new Date();
  const todayStr = getTodayStr();

  // Current streak: consecutive days with workouts ending today (or yesterday if not yet worked out today)
  const workoutDates = new Set(workouts.map((w) => w.date));
  let streak = 0;
  const checkDate = new Date(today);

  // If no workout today, start checking from yesterday
  if (!workoutDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (workoutDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // This month count
  const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = workouts.filter((w) => w.date.startsWith(monthPrefix)).length;

  // This week count (Mon-Sun)
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  const thisWeek = workouts.filter((w) => w.date >= mondayStr && w.date <= todayStr).length;

  return { streak, thisMonth, thisWeek, total: workouts.length };
}

function computeTrends(workouts: Workout[]): LiftTrend[] {
  // Find exercises that appear multiple times
  const exerciseHistory: Record<string, { weight: number; date: string }[]> = {};

  for (const w of workouts) {
    for (const ex of w.exercises) {
      const maxWeight = Math.max(...ex.sets.filter((s) => !s.isWarmup).map((s) => s.weight));
      if (maxWeight > 0) {
        if (!exerciseHistory[ex.name]) exerciseHistory[ex.name] = [];
        exerciseHistory[ex.name].push({ weight: maxWeight, date: w.date });
      }
    }
  }

  const trends: LiftTrend[] = [];
  for (const [name, history] of Object.entries(exerciseHistory)) {
    if (history.length < 2) continue;
    const sorted = history.sort((a, b) => a.date.localeCompare(b.date));
    const current = sorted[sorted.length - 1].weight;
    const oldest = sorted[0].weight;
    const unit = workouts.find((w) => w.exercises.find((e) => e.name === name))?.exercises.find((e) => e.name === name)?.weightUnit || 'lb';
    const weeks = Math.max(1, Math.round((new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / (7 * 24 * 60 * 60 * 1000)));

    trends.push({
      name: name.length > 12 ? name.split(' ')[0] : name,
      currentWeight: current,
      unit,
      delta: current - oldest,
      period: `${weeks}w`,
      sparkline: sorted.map((s) => s.weight),
    });
  }

  return trends.slice(0, 5); // Top 5 exercises
}

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ weightUnit: 'lb', userName: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load workouts and settings from storage on mount
  useEffect(() => {
    Promise.all([loadWorkouts(), loadSettings()]).then(([stored, storedSettings]) => {
      setWorkouts(stored);
      setSettings(storedSettings);
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Save workouts whenever they change
  const updateWorkouts = useCallback((updater: (prev: Workout[]) => Workout[]) => {
    setWorkouts((prev) => {
      const next = updater(prev);
      saveWorkouts(next);
      return next;
    });
  }, []);

  const stats = useMemo(() => computeStats(workouts), [workouts]);
  const heatmapData = useMemo(() => computeHeatmapData(workouts, viewYear, viewMonth), [workouts, viewYear, viewMonth]);
  const monthLabel = useMemo(() => getMonthLabel(viewYear, viewMonth), [viewYear, viewMonth]);
  const trends = useMemo(() => computeTrends(workouts), [workouts]);

  const now = new Date();
  const canGoNext = viewYear < now.getFullYear() || (viewYear === now.getFullYear() && viewMonth < now.getMonth());

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Build map of previous exercise sessions for delta comparison
  const previousExerciseMap = useMemo(() => {
    const map: Record<string, Exercise> = {};
    if (!selectedDate) return map;

    // Sort workouts by date descending, find most recent before selected date
    const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
    const selectedWorkout = sorted.find((w) => w.date === selectedDate);
    if (!selectedWorkout) return map;

    for (const ex of selectedWorkout.exercises) {
      // Find the same exercise in a previous workout
      for (const w of sorted) {
        if (w.date >= selectedDate) continue;
        const prevEx = w.exercises.find((e) => e.name === ex.name);
        if (prevEx) {
          map[ex.id] = prevEx;
          break;
        }
      }
    }
    return map;
  }, [workouts, selectedDate]);

  const selectedWorkout = workouts.find((w) => w.date === selectedDate);
  const isToday = selectedDate === getTodayStr();

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const handleUpdateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    updateWorkouts((prev) =>
      prev.map((w) => {
        if (w.date !== selectedDate) return w;
        return {
          ...w,
          exercises: w.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s, i) => {
                if (i !== setIndex) return s;
                return { ...s, [field]: value };
              }),
            };
          }),
        };
      })
    );
  };

  const handleAddSet = (exerciseId: string) => {
    updateWorkouts((prev) =>
      prev.map((w) => {
        if (w.date !== selectedDate) return w;
        return {
          ...w,
          exercises: w.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const lastSet = ex.sets[ex.sets.length - 1];
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  setNumber: ex.sets.length + 1,
                  reps: lastSet?.reps || 0,
                  weight: lastSet?.weight || 0,
                },
              ],
            };
          }),
        };
      })
    );
  };

  const handleDeleteSet = (exerciseId: string, setIndex: number) => {
    updateWorkouts((prev) =>
      prev.map((w) => {
        if (w.date !== selectedDate) return w;
        return {
          ...w,
          exercises: w.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const newSets = ex.sets.filter((_, i) => i !== setIndex)
              .map((s, i) => ({ ...s, setNumber: i + 1 }));
            return { ...ex, sets: newSets };
          }).filter((ex) => ex.sets.length > 0),
        };
      })
    );
  };

  const handleDeleteExercise = (exerciseId: string) => {
    updateWorkouts((prev) =>
      prev.map((w) => {
        if (w.date !== selectedDate) return w;
        return {
          ...w,
          exercises: w.exercises.filter((ex) => ex.id !== exerciseId),
        };
      }).filter((w) => w.exercises.length > 0) // Remove workout if no exercises left
    );
  };

  const handleConfirmWorkout = (parsed: { label?: string; notes?: string; exercises: Exercise[] }) => {
    const today = getTodayStr();
    const existing = workouts.find((w) => w.date === today);

    if (existing) {
      updateWorkouts((prev) =>
        prev.map((w) => {
          if (w.date !== today) return w;
          return {
            ...w,
            label: parsed.label || w.label,
            notes: parsed.notes || w.notes,
            exercises: [...w.exercises, ...parsed.exercises],
          };
        })
      );
    } else {
      const newWorkout: Workout = {
        id: `w-${Date.now()}`,
        date: today,
        label: parsed.label,
        notes: parsed.notes,
        exercises: parsed.exercises,
        createdAt: new Date().toISOString(),
      };
      updateWorkouts((prev) => [newWorkout, ...prev]);
    }

    setSelectedDate(today);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Gym</Text>
            <Text style={styles.titleAccent}>Chat</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonBlock} />
          <View style={[styles.skeletonBlock, { width: '60%', height: 12 }]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Gym</Text>
          <Text style={styles.titleAccent}>Chat</Text>
        </View>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>&#9881;</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats bar */}
        {workouts.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.streak}</Text>
              <Text style={styles.statLabel}>streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.thisWeek}</Text>
              <Text style={styles.statLabel}>this week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.thisMonth}</Text>
              <Text style={styles.statLabel}>this month</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>total</Text>
            </View>
          </View>
        )}

        <Heatmap
          data={heatmapData}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          monthLabel={monthLabel}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          canGoNext={canGoNext}
        />

        {/* Selected day workout */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isToday ? 'Today' : formatDate(selectedDate)}
              {selectedWorkout?.label ? ` · ${selectedWorkout.label}` : ''}
            </Text>
          </View>

          {selectedWorkout?.notes && (
            <View style={styles.notesBadge}>
              <Text style={styles.notesText}>{selectedWorkout.notes}</Text>
            </View>
          )}

          {selectedWorkout ? (
            selectedWorkout.exercises.map((exercise) => (
              <WorkoutTable
                key={exercise.id}
                exercise={exercise}
                previousExercise={previousExerciseMap[exercise.id]}
                onUpdateSet={handleUpdateSet}
                onAddSet={handleAddSet}
                onDeleteSet={handleDeleteSet}
                onDeleteExercise={handleDeleteExercise}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{isToday ? '✦' : '—'}</Text>
              <Text style={styles.emptyText}>
                {isToday ? 'No workout yet' : 'Rest day'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isToday ? 'Tap ✦ to log your workout' : 'No workout recorded'}
              </Text>
            </View>
          )}
        </View>

        {/* Trends */}
        {trends.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.md }]}>Trends</Text>
            <View style={styles.trendsContainer}>
              {trends.map((trend) => (
                <TrendRow key={trend.name} trend={trend} />
              ))}
            </View>
          </View>
        )}

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>
      </Animated.View>

      <FAB onPress={() => setOverlayVisible(true)} />

      <AIOverlay
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
        onConfirm={handleConfirmWorkout}
      />

      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        settings={settings}
        onSettingsChange={setSettings}
        workouts={workouts}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  skeletonBlock: {
    height: 16,
    width: '40%',
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: colors.accent,
    fontSize: fontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    padding: spacing.sm,
  },
  settingsIcon: {
    color: colors.textTertiary,
    fontSize: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  notesBadge: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  notesText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl + spacing.md,
  },
  emptyIcon: {
    color: colors.textTertiary,
    fontSize: 32,
    marginBottom: spacing.sm,
    opacity: 0.5,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  emptySubtext: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  trendsContainer: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
