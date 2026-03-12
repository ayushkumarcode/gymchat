import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, fontSize } from '../utils/theme';
import { parseWorkoutWithAI, ParsedWorkout } from '../utils/ai';

interface AIOverlayProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (parsed: ParsedWorkout) => void;
  weightUnit?: 'lb' | 'kg';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Web Speech API hook
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = Platform.OS === 'web' && typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, isSupported, startListening, stopListening };
}

export default function AIOverlay({ visible, onClose, onConfirm, weightUnit = 'lb' }: AIOverlayProps) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedWorkout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const { isListening, transcript, isSupported: micSupported, startListening, stopListening } = useSpeechRecognition();

  // Sync transcript to input while listening
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

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
      setMessages([]);
      if (isListening) stopListening();
    }
  }, [visible]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    if (isListening) stopListening();

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    setParsed(null);

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);

    // Scroll to bottom after adding message
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await parseWorkoutWithAI(userMessage, messages, weightUnit);

      const assistantContent = JSON.stringify(result);
      setMessages([...updatedMessages, { role: 'assistant', content: assistantContent }]);

      setParsed(result);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('AI error:', error);
      setParsed({
        exercises: [],
        clarifyingQuestion: 'Something went wrong. Try again?',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (parsed && parsed.exercises.length > 0) {
      onConfirm(parsed);
      onClose();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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

        <Animated.View style={[styles.sheetOuter, { transform: [{ translateY }] }]}>
          <BlurView intensity={40} tint="dark" style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            ref={scrollRef}
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Conversation history */}
            {messages.map((msg, idx) => {
              if (msg.role === 'assistant') return null;
              return (
                <View key={idx} style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{msg.content}</Text>
                </View>
              );
            })}

            {/* Processing indicator */}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={styles.processingText}>Parsing your workout...</Text>
              </View>
            )}

            {/* Parsed result preview */}
            {parsed && !isProcessing && (
              <View style={styles.parsedContainer}>
                {parsed.notes && (
                  <View style={styles.notesBadge}>
                    <Text style={styles.notesText}>{parsed.notes}</Text>
                  </View>
                )}

                {parsed.exercises.length > 0 && (
                  <>
                    <Text style={styles.parsedLabel}>
                      {parsed.label || 'Workout'}
                    </Text>
                    {parsed.exercises.map((ex) => (
                      <View key={ex.id} style={styles.parsedExercise}>
                        <Text style={styles.parsedExName}>
                          {ex.name}{ex.variant ? ` (${ex.variant})` : ''}
                        </Text>
                        {ex.sets.map((s, si) => (
                          <Text key={si} style={styles.parsedSet}>
                            {s.isWarmup ? '  W' : `  ${s.setNumber}`}
                            {'  '}
                            {s.weight > 0 ? `${s.weight} ${ex.weightUnit}` : 'BW'}
                            {' × '}
                            {s.reps}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </>
                )}

                {parsed.clarifyingQuestion && (
                  <Text style={styles.question}>{parsed.clarifyingQuestion}</Text>
                )}

                {!parsed.clarifyingQuestion && parsed.exercises.length > 0 && (
                  <View style={styles.confirmRow}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                      <Text style={styles.confirmBtnText}>Log it</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        setParsed(null);
                        inputRef.current?.focus();
                      }}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Listening indicator */}
          {isListening && (
            <View style={styles.listeningBar}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningText}>Listening...</Text>
            </View>
          )}

          {/* Input area */}
          <View style={styles.inputRow}>
            {micSupported && (
              <TouchableOpacity
                style={[styles.micBtn, isListening && styles.micBtnActive]}
                onPress={handleMicToggle}
              >
                <Text style={[styles.micIcon, isListening && styles.micIconActive]}>
                  {isListening ? '■' : '🎙'}
                </Text>
              </TouchableOpacity>
            )}
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={isListening ? 'Speak your workout...' : 'Type or speak your workout...'}
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={2000}
              returnKeyType="default"
              onKeyPress={(e: any) => {
                if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isProcessing) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isProcessing}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
          </BlurView>
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
  sheetOuter: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '75%',
  },
  sheet: {
    backgroundColor: 'rgba(18, 18, 18, 0.88)',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.md,
    maxHeight: 400,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 14,
    borderBottomRightRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  userBubbleText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  processingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  parsedContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesBadge: {
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  notesText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  parsedLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  parsedExercise: {
    marginBottom: spacing.sm,
  },
  parsedExName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  parsedSet: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  question: {
    color: colors.accent,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  confirmRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: colors.bg,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  editBtn: {
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  listeningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  listeningText: {
    color: colors.red,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  micBtnActive: {
    backgroundColor: colors.redMuted,
    borderColor: colors.red,
  },
  micIcon: {
    fontSize: 18,
  },
  micIconActive: {
    color: colors.red,
    fontSize: 14,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: fontSize.md,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontWeight: '700',
  },
});
