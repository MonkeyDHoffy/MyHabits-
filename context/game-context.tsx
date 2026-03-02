import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fromStoredRun, loadStoredGameState, saveStoredGameState } from '@/context/game-storage';
import { MAX_HP } from '@/context/game/constants';
import { resolveDayEnd } from '@/context/game/day-end';
import { createHabit, removeHabitById, resetAllHabitCounters } from '@/context/game/habit-helpers';
import { clampHP, createDailyProgress, createInactiveRun, createWeeklyJokers, getWeeklyJokerCount } from '@/context/game/run-helpers';
import { calculateToggleResult } from '@/context/game/toggle-helpers';
import type { HabitItem, HabitType, RunState } from '@/context/game/types';

export type { HabitItem, HabitType, RunDailyProgress, RunState } from '@/context/game/types';

type GameContextValue = {
  habits: HabitItem[];
  run: RunState;
  maxHP: number;
  isHydrated: boolean;
  isDevMode: boolean;
  addHabit: (title: string, targetPerWeek: number, type: HabitType) => void;
  deleteHabit: (habitId: string) => void;
  startRun: () => void;
  advanceRunDayForDevelopment: () => void;
  endRun: () => void;
  resetRun: () => void;
  toggleHabitForToday: (habitId: string) => void;
  toggleDevMode: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

// Stellt Habit- und Run-Logik zentral für die gesamte App bereit.
export function GameProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [run, setRun] = useState<RunState>(createInactiveRun());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  // Lädt den gespeicherten Zustand einmal beim App-Start.
  useEffect(() => {
    let isMounted = true;

    async function hydrateFromStorage() {
      const storedState = await loadStoredGameState();

      if (!isMounted) {
        return;
      }

      if (storedState) {
        setHabits(storedState.habits);
        setRun(fromStoredRun(storedState.run));
      }

      setIsHydrated(true);
    }

    void hydrateFromStorage();

    return () => {
      isMounted = false;
    };
  }, []);

  // Speichert bei Änderungen von Habits oder Run den aktuellen Zustand.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void saveStoredGameState(habits, run);
  }, [habits, isHydrated, run]);

  // Fügt eine neue Gewohnheit hinzu und erweitert den Run-Progress bei aktivem Run.
  const addHabit = useCallback((title: string, targetPerWeek: number, type: HabitType) => {
    const nextHabit = createHabit(title, targetPerWeek, type);
    setHabits((currentHabits) => [nextHabit, ...currentHabits]);

    setRun((currentRun) => {
      if (!currentRun.isActive) {
        return currentRun;
      }

      return {
        ...currentRun,
        dailyProgress: {
          ...currentRun.dailyProgress,
          [nextHabit.id]: { completedToday: false, usedJokerToday: false },
        },
        weeklyJokers: {
          ...currentRun.weeklyJokers,
          [nextHabit.id]: getWeeklyJokerCount(nextHabit),
        },
      };
    });
  }, []);

  // Löscht eine Gewohnheit über ihre ID.
  const deleteHabit = useCallback((habitId: string) => {
    setHabits((currentHabits) => {
      return removeHabitById(currentHabits, habitId);
    });
  }, []);

  // Startet einen neuen Run mit vollem HP und frischem Daily-Progress.
  const startRun = useCallback(() => {
    const nextProgress = createDailyProgress(habits);

    setRun({
      isActive: true,
      startedAt: new Date(),
      dayNumber: 1,
      weekDayNumber: 1,
      playerHP: MAX_HP,
      enemyHP: MAX_HP,
      weeklyJokers: createWeeklyJokers(habits),
      dailyProgress: nextProgress,
    });
  }, [habits]);

  // Schließt den aktuellen Tag ab und startet den nächsten Tag im selben Run.
  const advanceRunDayForDevelopment = useCallback(() => {
    if (!run.isActive) {
      return;
    }

    const dayResult = resolveDayEnd(habits, run.dailyProgress, run.weeklyJokers);

    setHabits(dayResult.nextHabits);

    setRun((currentRun) => {
      if (!currentRun.isActive) {
        return currentRun;
      }

      const nextWeekDayNumber = currentRun.weekDayNumber + 1 > 7 ? 1 : currentRun.weekDayNumber + 1;
      const isNewWeek = nextWeekDayNumber === 1;
      const nextJokers = isNewWeek
        ? createWeeklyJokers(dayResult.nextHabits)
        : dayResult.nextJokers;

      return {
        ...currentRun,
        dayNumber: currentRun.dayNumber + 1,
        weekDayNumber: nextWeekDayNumber,
        playerHP: clampHP(currentRun.playerHP + dayResult.playerHealAmount),
        enemyHP: clampHP(currentRun.enemyHP + dayResult.enemyHealAmount),
        weeklyJokers: nextJokers,
        dailyProgress: createDailyProgress(dayResult.nextHabits),
      };
    });
  }, [habits, run.dailyProgress, run.isActive, run.weeklyJokers]);

  // Beendet den aktiven Run und berechnet abschließend die Streaks.
  const endRun = useCallback(() => {
    setHabits((currentHabits) => resetAllHabitCounters(currentHabits));
    setRun(createInactiveRun());
  }, []);

  // Setzt den Run ohne Streak-Auswertung direkt zurück.
  const resetRun = useCallback(() => {
    setHabits((currentHabits) => resetAllHabitCounters(currentHabits));
    setRun(createInactiveRun());
  }, []);

  // Schaltet den Tagesstatus einer Gewohnheit und aktualisiert reversibel die HP.
  const toggleHabitForToday = useCallback((habitId: string) => {
    if (!run.isActive) {
      return;
    }

    const targetHabit = habits.find((habit) => habit.id === habitId);

    if (!targetHabit) {
      return;
    }

    const toggleResult = calculateToggleResult(habits, run, targetHabit, habitId);

    if (toggleResult.shouldFinishRun) {
      setHabits(resetAllHabitCounters(toggleResult.nextHabits));
      setRun(createInactiveRun());
      return;
    }

    setHabits(toggleResult.nextHabits);
    setRun(toggleResult.nextRun);
  }, [habits, run]);

  // Schaltet den Dev-Modus für Debug-UI ein oder aus.
  const toggleDevMode = useCallback(() => {
    setIsDevMode((currentValue) => !currentValue);
  }, []);

  const value = useMemo(() => {
    return {
      habits,
      run,
      maxHP: MAX_HP,
      isHydrated,
      isDevMode,
      addHabit,
      deleteHabit,
      startRun,
      advanceRunDayForDevelopment,
      endRun,
      resetRun,
      toggleHabitForToday,
      toggleDevMode,
    };
  }, [
    addHabit,
    advanceRunDayForDevelopment,
    deleteHabit,
    endRun,
    habits,
    isHydrated,
    isDevMode,
    resetRun,
    run,
    startRun,
    toggleDevMode,
    toggleHabitForToday,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// Liefert den zentralen Game-State und alle Gameplay-Aktionen.
export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }

  return context;
}
