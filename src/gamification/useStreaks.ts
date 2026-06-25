/**
 * Headless reactive controller for streaks + badges. Logic only (no UI).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type Badge,
  type StreakData,
  awardBadge,
  getBadges,
  getStreakData,
  recordStudySession,
} from './streakService';

export interface UseStreaksResult {
  streak: StreakData | null;
  badges: Badge[];
  isLoading: boolean;
  error: Error | null;
  recordSession: () => Promise<void>;
  award: (badgeId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useStreaks(): UseStreaksResult {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const set = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [streakData, badgeList] = await Promise.all([getStreakData(), getBadges()]);
      set(setStreak, streakData);
      set(setBadges, badgeList);
      set(setError, null);
    } catch (err) {
      set(setError, err as Error);
    } finally {
      set(setIsLoading, false);
    }
  }, [set]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recordSession = useCallback(async () => {
    try {
      const updated = await recordStudySession();
      set(setStreak, updated);
      set(setBadges, await getBadges());
    } catch (err) {
      set(setError, err as Error);
    }
  }, [set]);

  const award = useCallback(
    async (badgeId: string) => {
      try {
        await awardBadge(badgeId);
        set(setBadges, await getBadges());
      } catch (err) {
        set(setError, err as Error);
      }
    },
    [set],
  );

  return { streak, badges, isLoading, error, recordSession, award, refresh };
}
