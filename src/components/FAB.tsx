import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../utils/theme';
import AnimatedPressable from './AnimatedPressable';

interface FABProps {
  onPress: () => void;
}

export default function FAB({ onPress }: FABProps) {
  return (
    <AnimatedPressable style={styles.fab} onPress={onPress} scale={0.9}>
      <Text style={styles.icon}>✦</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 36,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    color: colors.bg,
    fontSize: 22,
    fontWeight: '600',
  },
});
