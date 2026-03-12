import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors, spacing, fontSize } from '../utils/theme';
import { DayData } from '../types/workout';

interface HeatmapProps {
  data: DayData[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const CELL_GAP = 5;
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getIntensityColor(intensity: 0 | 1 | 2 | 3): string {
  switch (intensity) {
    case 0: return colors.heatmap0;
    case 1: return colors.heatmap1;
    case 2: return colors.heatmap2;
    case 3: return colors.heatmap3;
  }
}

function getMonthName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr === todayStr;
}

export default function Heatmap({ data, selectedDate, onSelectDate }: HeatmapProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  if (data.length === 0) return null;

  const monthLabel = getMonthName(data[0].date);

  // Build weeks grid — first day of month might not be Monday
  const firstDate = new Date(data[0].date + 'T00:00:00');
  let dayOfWeek = firstDate.getDay(); // 0=Sun, 1=Mon...
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // convert to Mon=0

  const weeks: (DayData | null)[][] = [];
  let currentWeek: (DayData | null)[] = Array(dayOfWeek).fill(null);

  for (const day of data) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  // 7 cells with 6 gaps between them
  const cellSize = containerWidth > 0
    ? Math.floor((containerWidth - CELL_GAP * 6) / 7)
    : 36;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>

      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label) => (
          <Text key={label} style={[styles.dayLabel, { width: cellSize }]}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={`empty-${di}`} style={[styles.emptyCell, { width: cellSize, height: cellSize }]} />;
            }
            const selected = selectedDate === day.date;
            const today = isToday(day.date);
            return (
              <TouchableOpacity
                key={day.date}
                onPress={() => onSelectDate(day.date)}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize, backgroundColor: getIntensityColor(day.intensity) },
                  selected && styles.cellSelected,
                  today && !selected && styles.cellToday,
                ]}
              >
                <Text style={[
                  styles.cellText,
                  day.intensity > 0 && styles.cellTextActive,
                  selected && styles.cellTextSelected,
                ]}>
                  {new Date(day.date + 'T00:00:00').getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  monthLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CELL_GAP,
  },
  dayLabel: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CELL_GAP,
  },
  cell: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCell: {},
  cellSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
  },
  cellText: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  cellTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  cellTextSelected: {
    color: colors.text,
  },
});
