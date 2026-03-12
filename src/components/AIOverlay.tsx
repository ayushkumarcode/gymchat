import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { colors, spacing, fontSize } from '../utils/theme';
import { Exercise } from '../types/workout';

interface ParsedWorkout {
  label?: string;
  notes?: string;
  exercises: Exercise[];
}

interface AIOverlayProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (parsed: ParsedWorkout) => void;
}

// Mock AI parsing — will be replaced with Claude API
function mockParseWorkout(text: string): { parsed: ParsedWorkout; question?: string } {
  const lower = text.toLowerCase();

  const exercises: Exercise[] = [];

  // Simple mock: detect "bench" mention
  if (lower.includes('bench')) {
    const weightMatch = lower.match(/(\d+)\s*(?:lb|kg|for)/);
    const repsMatches = [...lower.matchAll(/for\s+([\d\s]+)/g)];
    exercises.push({
      id: `e-${Date.now()}-1`,
      name: 'Bench Press',
      variant: lower.includes('incline') ? 'incline' : 'flat',
      weightUnit: lower.includes('kg') ? 'kg' : 'lb',
      sets: [
        { setNumber: 1, reps: 8, weight: weightMatch ? parseInt(weightMatch[1]) : 135 },
        { setNumber: 2, reps: 8, weight: weightMatch ? parseInt(weightMatch[1]) : 135 },
        { setNumber: 3, reps: 7, weight: weightMatch ? parseInt(weightMatch[1]) : 135 },
      ],
    });
  }

  if (lower.includes('squat')) {
    exercises.push({
      id: `e-${Date.now()}-2`,
      name: 'Squat',
      weightUnit: lower.includes('kg') ? 'kg' : 'lb',
      sets: [
        { setNumber: 1, reps: 5, weight: 225 },
        { setNumber: 2, reps: 5, weight: 225 },
        { setNumber: 3, reps: 5, weight: 225 },
      ],
    });
  }

  if (lower.includes('lateral') || lower.includes('raise')) {
    exercises.push({
      id: `e-${Date.now()}-3`,
      name: 'Lateral Raise',
      variant: lower.includes('incline') ? 'incline' : undefined,
      weightUnit: lower.includes('kg') ? 'kg' : 'lb',
      sets: [
        { setNumber: 1, reps: 12, weight: 8 },
      ],
    });
  }

  // Fallback if nothing detected
  if (exercises.length === 0) {
    exercises.push({
      id: `e-${Date.now()}-0`,
      name: 'Exercise',
      weightUnit: 'lb',
      sets: [{ setNumber: 1, reps: 10, weight: 100 }],
    });
  }

  const notes = lower.includes('weak') || lower.includes('tired')
    ? text.split('.')[0]
    : undefined;

  return {
    parsed: {
      label: 'Push Day',
      notes,
      exercises,
    },
    question: exercises.length === 1 && exercises[0].name === 'Exercise'
      ? "I couldn't parse specific exercises. Could you be more specific?"
      : undefined,
  };
}

export default function AIOverlay({ visible, onClose, onConfirm }: AIOverlayProps) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedWorkout | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      slideAnim.setValue(0);
      setInput('');
      setParsed(null);
      setQuestion(null);
    }
  }, [visible]);

  const handleSend = () => {
    if (!input.trim()) return;
    setIsProcessing(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const result = mockParseWorkout(input);
      setParsed(result.parsed);
      setQuestion(result.question || null);
      setIsProcessing(false);
    }, 600);
  };

  const handleConfirm = () => {
    if (parsed) {
      onConfirm(parsed);
      onClose();
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Parsed result preview */}
          {parsed && (
            <View style={styles.parsedContainer}>
              <Text style={styles.parsedLabel}>Parsed:</Text>
              {parsed.notes && (
                <Text style={styles.parsedNote}>{parsed.notes}</Text>
              )}
              {parsed.exercises.map((ex) => (
                <View key={ex.id} style={styles.parsedExercise}>
                  <Text style={styles.parsedExName}>
                    {ex.name}{ex.variant ? ` (${ex.variant})` : ''}
                  </Text>
                  <Text style={styles.parsedSets}>
                    {ex.sets.map((s) => `${s.weight}${ex.weightUnit} x ${s.reps}`).join(' · ')}
                  </Text>
                </View>
              ))}

              {question && (
                <Text style={styles.question}>{question}</Text>
              )}

              {!question && (
                <View style={styles.confirmRow}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmBtnText}>Log it</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editBtn} onPress={() => setParsed(null)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <Text style={styles.processingText}>Parsing...</Text>
            </View>
          )}

          {/* Input area */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type or speak your workout..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isProcessing}
            >
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    maxHeight: '70%',
  },
  parsedContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  parsedLabel: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  parsedNote: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  parsedExercise: {
    marginBottom: spacing.xs,
  },
  parsedExName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  parsedSets: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  question: {
    color: colors.accent,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: colors.bg,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  editBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  processingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  processingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  sendBtnText: {
    color: colors.bg,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
