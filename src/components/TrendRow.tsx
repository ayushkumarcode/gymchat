import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../utils/theme';
import { LiftTrend } from '../types/workout';

interface TrendRowProps {
  trend: LiftTrend;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const CHART_WIDTH = 80;
  const CHART_HEIGHT = 20;
  const step = CHART_WIDTH / (data.length - 1);

  // Build sparkline using simple block characters
  const normalized = data.map((v) => (v - min) / range);
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  const sparkText = normalized
    .map((v) => blocks[Math.round(v * (blocks.length - 1))])
    .join('');

  return (
    <Text style={styles.sparkline}>{sparkText}</Text>
  );
}

export default function TrendRow({ trend, isLast }: TrendRowProps & { isLast?: boolean }) {
  const sign = trend.delta >= 0 ? '+' : '';

  return (
    <View style={[styles.container, !isLast && styles.containerBorder]}>
      <Text style={styles.name} numberOfLines={1}>{trend.name}</Text>
      <Sparkline data={trend.sparkline} />
      <Text style={styles.current}>
        {trend.currentWeight}{trend.unit}
      </Text>
      <Text style={[styles.delta, trend.delta >= 0 ? styles.deltaUp : styles.deltaDown]}>
        {sign}{trend.delta}/{trend.period}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  containerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    width: 70,
  },
  sparkline: {
    color: colors.accent,
    fontSize: fontSize.md,
    letterSpacing: 1,
    flex: 1,
  },
  current: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    width: 55,
    textAlign: 'right',
  },
  delta: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  deltaUp: {
    color: colors.accent,
  },
  deltaDown: {
    color: colors.red,
  },
});
