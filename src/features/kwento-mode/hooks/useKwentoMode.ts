/**
 * Headless reactive controller for Kwento Mode (logic only, no UI).
 *
 * Owns the per-session story state machine: generate a kwento, submit an answer,
 * reveal hint/solution, and advance adaptive difficulty (correct -> +1; two
 * consecutive wrong -> -1, per spec 5.8). Misconception Detection (spec 5.9) is
 * an OPTIONAL injected analyzer so this hook compiles and runs before that
 * feature exists; when supplied, a wrong answer is routed through it before the
 * generic "wrong" state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { recordStudySession } from '@/gamification/streakService';
import type { LearningProfile } from '@/profile/types';

import { DEFAULT_KWENTO_DIFFICULTY } from '../constants/kwentoDefaults';
import { checkKwentoAnswer } from '../services/answerCheck';
import { recordKwentoAttempt } from '../services/kwentoCache';
import { generateKwento, getNextDifficulty } from '../services/kwentoModeService';
import type {
  KwentoCulturalSetting,
  KwentoDifficulty,
  KwentoLanguage,
  KwentoModeRequest,
  KwentoModeResponse,
} from '../types/kwento.types';

/** Story state machine phase. */
export type KwentoPhase =
  | 'idle'
  | 'generating'
  | 'story'
  | 'checking'
  | 'correct'
  | 'wrong'
  | 'misconception';

export interface KwentoMisconceptionInput {
  studentAnswer: string;
  expectedSolution: string;
  melcTopic: string;
  gradeLevel: number;
  language: KwentoLanguage;
}

export interface KwentoMisconceptionResult {
  hasMisconception: boolean;
  explanation?: string;
  misconceptionType?: string;
}

/** Pluggable seam for spec 5.9 Misconception Detection. */
export type KwentoMisconceptionAnalyzer = (
  input: KwentoMisconceptionInput,
) => Promise<KwentoMisconceptionResult>;

export interface UseKwentoModeConfig {
  /** Active learning profile — supplies grade level (and future formatting). */
  profile: LearningProfile;
  /** Language register for generated stories. */
  languagePreference: KwentoLanguage;
  /** Default MELC topic; can be overridden per generateNew call. */
  melcTopic?: string;
  /** Optional pinned cultural setting (otherwise the builder picks). */
  culturalSetting?: KwentoCulturalSetting;
  /** Force the compact offline path. */
  isOffline?: boolean;
  /** Optional Misconception Detection analyzer (spec 5.9). */
  analyzeMisconception?: KwentoMisconceptionAnalyzer;
  /** Count a correct answer toward the daily streak. Defaults to true. */
  recordStreakOnComplete?: boolean;
}

export interface GenerateNewOptions {
  melcTopic?: string;
  melcCompetency?: string;
  difficulty?: KwentoDifficulty;
  culturalSetting?: KwentoCulturalSetting;
}

export interface UseKwentoModeResult {
  kwento: KwentoModeResponse | null;
  isLoading: boolean;
  phase: KwentoPhase;
  error: Error | null;
  currentDifficulty: KwentoDifficulty;
  attemptCount: number;
  hintUsed: boolean;
  solutionRevealed: boolean;
  misconception: KwentoMisconceptionResult | null;
  generateNew: (options?: GenerateNewOptions) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  revealHint: () => void;
  revealSolution: () => void;
  reset: () => void;
}

const RECENT_ID_LIMIT = 3;

export function useKwentoMode(config: UseKwentoModeConfig): UseKwentoModeResult {
  const [kwento, setKwento] = useState<KwentoModeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<KwentoPhase>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<KwentoDifficulty>(
    DEFAULT_KWENTO_DIFFICULTY,
  );
  const [attemptCount, setAttemptCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [misconception, setMisconception] = useState<KwentoMisconceptionResult | null>(null);

  // Refs for values that must not trigger re-renders / must avoid stale closures.
  const mountedRef = useRef(true);
  const consecutiveWrongRef = useRef(0);
  const recentIdsRef = useRef<string[]>([]);
  const hintUsedRef = useRef(false);
  const attemptCountRef = useRef(0);

  // Mirror useStreaks: guard against setting state after unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track mount status the same way useStreaks does.
  const set = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  const generateNew = useCallback(
    async (options: GenerateNewOptions = {}) => {
      const melcTopic = options.melcTopic ?? config.melcTopic;
      if (!melcTopic) {
        set(setError, new Error('Kwento Mode: a melcTopic is required to generate a story.'));
        return;
      }

      set(setIsLoading, true);
      set(setPhase, 'generating');
      set(setError, null);
      set(setMisconception, null);

      const difficulty = options.difficulty ?? currentDifficulty;

      const request: KwentoModeRequest = {
        gradeLevel: config.profile.gradeLevel,
        melcTopic,
        melcCompetency: options.melcCompetency,
        melcPassages: [],
        languagePreference: config.languagePreference,
        learningProfile: config.profile,
        culturalSetting: options.culturalSetting ?? config.culturalSetting,
        difficulty,
        previousKwentoIds: recentIdsRef.current.slice(),
        isOffline: config.isOffline ?? false,
      };

      try {
        const result = await generateKwento(request);
        if (!mountedRef.current) {
          return;
        }
        recentIdsRef.current = [result.id, ...recentIdsRef.current].slice(0, RECENT_ID_LIMIT);
        consecutiveWrongRef.current = 0;
        hintUsedRef.current = false;
        attemptCountRef.current = 0;
        setKwento(result);
        setAttemptCount(0);
        setHintUsed(false);
        setSolutionRevealed(false);
        setPhase('story');
      } catch (err) {
        set(setError, err as Error);
        set(setPhase, 'idle');
      } finally {
        set(setIsLoading, false);
      }
    },
    [config, currentDifficulty, set],
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      const current = kwento;
      if (!current) {
        return;
      }

      set(setPhase, 'checking');
      const isCorrect = checkKwentoAnswer(answer, current.suliranin_sagot);
      const nextAttemptCount = attemptCountRef.current + 1;
      attemptCountRef.current = nextAttemptCount;
      set(setAttemptCount, nextAttemptCount);

      // On a wrong answer, route through Misconception Detection if available.
      let misconceptionDetected: boolean | undefined;
      if (!isCorrect && config.analyzeMisconception) {
        try {
          const result = await config.analyzeMisconception({
            studentAnswer: answer,
            expectedSolution: current.suliranin_sagot,
            melcTopic: current.melc_topic,
            gradeLevel: current.grade_level,
            language: current.language_used,
          });
          misconceptionDetected = result.hasMisconception;
          if (result.hasMisconception) {
            set(setMisconception, result);
          }
        } catch {
          // Misconception analysis is best-effort; fall through to generic wrong.
        }
      }

      // Persist the attempt (best-effort).
      try {
        await recordKwentoAttempt({
          kwentoId: current.id,
          studentAnswer: answer,
          isCorrect,
          hintUsed: hintUsedRef.current,
          attemptCount: nextAttemptCount,
          misconceptionDetected,
          completedAt: new Date(),
        });
      } catch {
        // non-fatal
      }

      if (!mountedRef.current) {
        return;
      }

      if (isCorrect) {
        consecutiveWrongRef.current = 0;
        setCurrentDifficulty((d) => getNextDifficulty(d, true));
        setPhase('correct');
        if (config.recordStreakOnComplete !== false) {
          // Completed kwento counts toward the daily streak (spec 5.8).
          void recordStudySession().catch(() => undefined);
        }
        return;
      }

      // Wrong: two consecutive wrong answers step difficulty down (spec 5.8).
      consecutiveWrongRef.current += 1;
      if (consecutiveWrongRef.current >= 2) {
        consecutiveWrongRef.current = 0;
        setCurrentDifficulty((d) => getNextDifficulty(d, false));
      }
      setPhase(misconceptionDetected ? 'misconception' : 'wrong');
    },
    [kwento, config, set],
  );

  const revealHint = useCallback(() => {
    hintUsedRef.current = true;
    set(setHintUsed, true);
  }, [set]);

  const revealSolution = useCallback(() => {
    set(setSolutionRevealed, true);
  }, [set]);

  const reset = useCallback(() => {
    consecutiveWrongRef.current = 0;
    hintUsedRef.current = false;
    attemptCountRef.current = 0;
    set(setKwento, null);
    set(setPhase, 'idle');
    set(setMisconception, null);
    set(setAttemptCount, 0);
    set(setHintUsed, false);
    set(setSolutionRevealed, false);
  }, [set]);

  return {
    kwento,
    isLoading,
    phase,
    error,
    currentDifficulty,
    attemptCount,
    hintUsed,
    solutionRevealed,
    misconception,
    generateNew,
    submitAnswer,
    revealHint,
    revealSolution,
    reset,
  };
}
