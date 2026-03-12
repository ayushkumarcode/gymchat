import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, fontSize } from '../utils/theme';
import { Workout, Exercise } from '../types/workout';
import { mockWorkouts, generateHeatmapData, mockTrends } from '../data/mock';
import Heatmap from '../components/Heatmap';
import WorkoutTable from '../components/WorkoutTable';
import TrendRow from '../components/TrendRow';
import FAB from '../components/FAB';
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

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>(mockWorkouts);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [overlayVisible, setOverlayVisible] = useState(false);

  const heatmapData = useMemo(() => generateHeatmapData(), [workouts]);

  const selectedWorkout = workouts.find((w) => w.date === selectedDate);
  const isToday = selectedDate === getTodayStr();

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const handleUpdateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setWorkouts((prev) =>
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

  const handleConfirmWorkout = (parsed: { label?: string; notes?: string; exercises: Exercise[] }) => {
    const today = getTodayStr();
    const existing = workouts.find((w) => w.date === today);

    if (existing) {
      // Append exercises to today's workout
      setWorkouts((prev) =>
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
      // Create new workout for today
      const newWorkout: Workout = {
        id: `w-${Date.now()}`,
        date: today,
        label: parsed.label,
        notes: parsed.notes,
        exercises: parsed.exercises,
        createdAt: new Date().toISOString(),
      };
      setWorkouts((prev) => [newWorkout, ...prev]);
    }

    setSelectedDate(today);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>GymChat</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Heatmap
          data={heatmapData}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
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
                onUpdateSet={handleUpdateSet}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No workout</Text>
              <Text style={styles.emptySubtext}>
                {isToday ? 'Tap + to log your workout' : 'Rest day'}
              </Text>
            </View>
          )}
        </View>

        {/* Trends */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.md }]}>Trends</Text>
          <View style={styles.trendsContainer}>
            {mockTrends.map((trend) => (
              <TrendRow key={trend.name} trend={trend} />
            ))}
          </View>
        </View>

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB onPress={() => setOverlayVisible(true)} />

      <AIOverlay
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
        onConfirm={handleConfirmWorkout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
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
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
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
