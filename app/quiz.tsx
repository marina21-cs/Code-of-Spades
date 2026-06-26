// Suri — Pagsusulit (Quiz) runner.
// A self-contained quiz flow: generate (AI, RAG-grounded, language-aware) ->
// answer one question at a time with feedback -> results. Reached from the
// Quizzes tab via /quiz?topic=...
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ThemedText } from '@/components/ui';
import { generateQuiz } from '@/features/quizzes/quizService';
import type { Quiz } from '@/features/quizzes/types';
import { useProfile } from '@/profile/useProfile';
import { colors, radii, spacing } from '@/theme';

type Status = 'loading' | 'active' | 'done' | 'error';

export default function QuizScreen() {
  const { profile } = useProfile();
  const params = useLocalSearchParams<{ topic?: string }>();
  const topic = typeof params.topic === 'string' && params.topic.length > 0 ? params.topic : undefined;

  const [status, setStatus] = useState<Status>('loading');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Abort any in-flight generation when the screen unmounts or regenerates.
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setQuiz(null);
    setErrorMsg('');
    setIndex(0);
    setSelected(null);
    setScore(0);

    try {
      const generated = await generateQuiz({ profile, topic, signal: controller.signal });
      if (controller.signal.aborted) {
        return;
      }
      setQuiz(generated);
      setStatus('active');
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : 'Hindi makabuo ng pagsusulit. Subukan muli.');
      setStatus('error');
    }
    // profile.gradeLevel / languagePreference / subject drive generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.gradeLevel, profile.languagePreference, profile.subject, topic]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const question = quiz?.questions[index];
  const total = quiz?.questions.length ?? 0;
  const answered = selected !== null;
  const isLast = index >= total - 1;

  const handleSelect = (choiceIndex: number) => {
    if (answered || !question) {
      return;
    }
    setSelected(choiceIndex);
    if (choiceIndex === question.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (isLast) {
      setStatus('done');
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header with back. */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bumalik"
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.accentPrimary} />
        </Pressable>
        <ThemedText variant="title" color={colors.accentPrimary} style={styles.headerTitle}>
          Pagsusulit
        </ThemedText>
        <View style={styles.iconButton} />
      </View>

      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
          <ThemedText variant="body" color={colors.textSecondary} center style={styles.centerText}>
            Binubuo ang iyong pagsusulit{topic ? ` tungkol sa ${topic}` : ''}…
          </ThemedText>
        </View>
      ) : null}

      {status === 'error' ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <ThemedText variant="title" color={colors.textPrimary} center style={styles.centerText}>
            Hindi makabuo ng pagsusulit
          </ThemedText>
          <ThemedText variant="bodySmall" color={colors.textSecondary} center style={styles.centerText}>
            {errorMsg}
          </ThemedText>
          <View style={styles.errorActions}>
            <Button label="Subukan muli" icon="refresh" onPress={() => void load()} />
            <Button label="Bumalik" variant="outline" onPress={() => router.back()} />
          </View>
        </View>
      ) : null}

      {status === 'active' && question ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          {/* Progress */}
          <View style={styles.progressRow}>
            <ThemedText variant="caption" color={colors.textSecondary} style={styles.progressLabel}>
              TANONG {index + 1} / {total}
            </ThemedText>
            <ThemedText variant="caption" color={colors.accentPrimary} style={styles.progressLabel}>
              {score} tama
            </ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index + 1) / total) * 100}%` }]} />
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            <ThemedText variant="title" color={colors.textPrimary} style={styles.questionText}>
              {question.question}
            </ThemedText>
          </View>

          {/* Choices */}
          <View style={styles.choices}>
            {question.choices.map((choice, i) => {
              const isCorrect = i === question.correctIndex;
              const isSelected = i === selected;
              // Color state only after the student answers.
              let choiceStyle = styles.choice;
              let labelColor = colors.textPrimary;
              if (answered) {
                if (isCorrect) {
                  choiceStyle = { ...styles.choice, ...styles.choiceCorrect };
                  labelColor = colors.success;
                } else if (isSelected) {
                  choiceStyle = { ...styles.choice, ...styles.choiceWrong };
                  labelColor = colors.danger;
                }
              }
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: answered }}
                  disabled={answered}
                  onPress={() => handleSelect(i)}
                  style={choiceStyle}
                >
                  <ThemedText variant="body" color={labelColor} style={styles.choiceText}>
                    {choice}
                  </ThemedText>
                  {answered && isCorrect ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  ) : answered && isSelected ? (
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Explanation + next */}
          {answered ? (
            <View style={styles.explanationBlock}>
              {question.explanation ? (
                <View style={styles.explanationCard}>
                  <ThemedText variant="bodySmall" color={colors.textSecondary}>
                    {question.explanation}
                  </ThemedText>
                </View>
              ) : null}
              <Button
                label={isLast ? 'Tapusin' : 'Susunod'}
                icon={isLast ? 'flag' : 'arrow-forward'}
                onPress={handleNext}
                fullWidth
              />
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {status === 'done' && quiz ? (
        <View style={styles.center}>
          <Ionicons name="trophy" size={56} color={colors.accentPrimary} />
          <ThemedText variant="display" color={colors.textPrimary} center style={styles.centerText}>
            {score} / {total}
          </ThemedText>
          <ThemedText variant="body" color={colors.textSecondary} center style={styles.centerText}>
            {scoreMessage(score, total)}
          </ThemedText>
          <View style={styles.errorActions}>
            <Button label="Ulitin" icon="refresh" onPress={() => void load()} />
            <Button label="Tapos na" variant="outline" onPress={() => router.back()} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/** Encouraging, grade-agnostic feedback line based on the score ratio. */
function scoreMessage(score: number, total: number): string {
  if (total === 0) {
    return '';
  }
  const ratio = score / total;
  if (ratio === 1) {
    return 'Ang galing! Perpekto ang iyong sagot. 🎉';
  }
  if (ratio >= 0.7) {
    return 'Magaling! Malapit ka nang ma-master ang paksa.';
  }
  if (ratio >= 0.4) {
    return 'Maganda ang simula — balikan natin ang ilang bahagi.';
  }
  return 'Okay lang ito — subukan nating pag-aralan ulit ang paksa.';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  centerText: {
    marginTop: spacing.xs,
  },
  errorActions: {
    marginTop: spacing.lg,
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentPrimary,
    borderRadius: radii.pill,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginTop: spacing.sm,
  },
  questionText: {
    lineHeight: 26,
  },
  choices: {
    gap: spacing.md,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  choiceCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.accentSecondaryDim,
  },
  choiceWrong: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(186, 26, 26, 0.10)',
  },
  choiceText: {
    flex: 1,
  },
  explanationBlock: {
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  explanationCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentPrimary,
  },
});
