/**
 * Focus-timer state machine for Kasabay Mode (spec 5.10). Pure + deterministic.
 *
 * The student starts a focus block (Suri "studies" alongside them), can interrupt
 * it to ask for help, resume, and eventually complete it. Every transition is a
 * pure function of (state, now) so the whole thing is headlessly verifiable and
 * free of timers/clocks. The UI supplies `now` (Date.now()).
 *
 * Study time is BANKED into accumulatedMs whenever a running segment ends; the
 * live elapsed value adds the in-progress segment. Transitions are defensive:
 * an illegal transition (e.g. interrupt while idle) returns the state unchanged.
 */
import type { FocusTimerState } from '../types/kasabay.types';

/** Create a fresh, idle timer for a block of `durationMs`. */
export function createFocusTimer(durationMs: number): FocusTimerState {
  return {
    status: 'idle',
    durationMs: Math.max(0, durationMs),
    accumulatedMs: 0,
    segmentStartedAt: null,
    interruptions: 0,
  };
}

/**
 * Start (or resume) the block. Valid from 'idle' or 'interrupted'; a no-op when
 * already running or completed.
 */
export function startFocusBlock(state: FocusTimerState, now: number): FocusTimerState {
  if (state.status !== 'idle' && state.status !== 'interrupted') {
    return state;
  }
  return { ...state, status: 'running', segmentStartedAt: now };
}

/** Resume an interrupted block. Alias of startFocusBlock for caller clarity. */
export function resumeFocusBlock(state: FocusTimerState, now: number): FocusTimerState {
  return startFocusBlock(state, now);
}

/**
 * Interrupt a running block so the student can ask for help. Banks the current
 * segment, increments the interruption count. A no-op unless currently running.
 */
export function interruptFocusBlock(state: FocusTimerState, now: number): FocusTimerState {
  if (state.status !== 'running') {
    return state;
  }
  return {
    ...state,
    status: 'interrupted',
    accumulatedMs: state.accumulatedMs + currentSegmentMs(state, now),
    segmentStartedAt: null,
    interruptions: state.interruptions + 1,
  };
}

/**
 * Complete the block. Banks any in-progress segment. Valid from running or
 * interrupted (and idle -> completed with zero study time); a no-op if already
 * completed.
 */
export function completeFocusBlock(state: FocusTimerState, now: number): FocusTimerState {
  if (state.status === 'completed') {
    return state;
  }
  return {
    ...state,
    status: 'completed',
    accumulatedMs: state.accumulatedMs + currentSegmentMs(state, now),
    segmentStartedAt: null,
  };
}

/** Length of the in-progress running segment (0 unless running). */
function currentSegmentMs(state: FocusTimerState, now: number): number {
  if (state.status !== 'running' || state.segmentStartedAt == null) {
    return 0;
  }
  return Math.max(0, now - state.segmentStartedAt);
}

/** Total study time so far: banked segments + the in-progress one. */
export function elapsedStudyMs(state: FocusTimerState, now: number): number {
  return state.accumulatedMs + currentSegmentMs(state, now);
}

/** Remaining time in the planned block (never negative). */
export function remainingMs(state: FocusTimerState, now: number): number {
  return Math.max(0, state.durationMs - elapsedStudyMs(state, now));
}

/** Whether the planned block duration has been reached. */
export function isBlockComplete(state: FocusTimerState, now: number): boolean {
  return elapsedStudyMs(state, now) >= state.durationMs;
}
