import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const MAX_HP = 100;

export type HabitType = 'good' | 'bad';

export type HabitItem = {
  id: string;
  title: string;
  targetPerWeek: number;
  type: HabitType;
  positiveStreak: number;
  negativeStreak: number;
};

export type RunDailyProgress = {
  [habitId: string]: {
    completedToday: boolean;
    usedJokerToday: boolean;
  };
};

export type RunState = {
  isActive: boolean;
  startedAt: Date | null;
  dayNumber: number;
  weekDayNumber: number;
  playerHP: number;
  enemyHP: number;
  weeklyJokers: Record<string, number>;
  dailyProgress: RunDailyProgress;
};

type GameContextValue = {
  habits: HabitItem[];
  run: RunState;
  maxHP: number;
  addHabit: (title: string, targetPerWeek: number, type: HabitType) => void;
  startRun: () => void;
  advanceRunDayForDevelopment: () => void;
  endRun: () => void;
  resetRun: () => void;
  toggleHabitForToday: (habitId: string) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

// Erzeugt den inaktiven Startzustand eines Runs.
function createInactiveRun(): RunState {
  return {
    isActive: false,
    startedAt: null,
    dayNumber: 0,
    weekDayNumber: 0,
    playerHP: MAX_HP,
    enemyHP: MAX_HP,
    weeklyJokers: {},
    dailyProgress: {},
  };
}

// Liefert die Anzahl Joker pro Woche für eine Gewohnheit.
function getWeeklyJokerCount(habit: HabitItem): number {
  if (habit.type === 'good') {
    return Math.max(0, 7 - habit.targetPerWeek);
  }

  return Math.max(0, habit.targetPerWeek);
}

// Erzeugt den wöchentlichen Joker-Status für alle Gewohnheiten.
function createWeeklyJokers(habits: HabitItem[]) {
  const jokers: Record<string, number> = {};

  habits.forEach((habit) => {
    jokers[habit.id] = getWeeklyJokerCount(habit);
  });

  return jokers;
}

// Erzeugt eine Daily-Progress-Struktur aus allen vorhandenen Gewohnheiten.
function createDailyProgress(habits: HabitItem[]): RunDailyProgress {
  const progress: RunDailyProgress = {};

  habits.forEach((habit) => {
    progress[habit.id] = { completedToday: false, usedJokerToday: false };
  });

  return progress;
}

// Schaltet den Tagesstatus einer Gewohnheit um.
function toggleDailyProgress(progress: RunDailyProgress, habitId: string): RunDailyProgress {
  const currentEntry = progress[habitId] ?? { completedToday: false, usedJokerToday: false };

  return {
    ...progress,
    [habitId]: {
      completedToday: !currentEntry.completedToday,
      usedJokerToday: false,
    },
  };
}

// Klemmt einen HP-Wert auf den gültigen Bereich von 0 bis MAX_HP.
function clampHP(value: number): number {
  return Math.max(0, Math.min(MAX_HP, value));
}

// Berechnet Player- und Enemy-HP aus dem aktuellen Tagesstatus.
function calculateHPFromProgress(habits: HabitItem[], progress: RunDailyProgress) {
  let playerHP = MAX_HP;
  let enemyHP = MAX_HP;

  habits.forEach((habit) => {
    const isCompleted = progress[habit.id]?.completedToday ?? false;

    if (!isCompleted) {
      return;
    }

    if (habit.type === 'good') {
      enemyHP = clampHP(enemyHP - habit.positiveStreak);
      return;
    }

    playerHP = clampHP(playerHP - habit.negativeStreak);
  });

  return { playerHP, enemyHP };
}

// Ermittelt den HP-Effekt beim Umschalten einer Gewohnheit.
function getToggleHPDelta(
  habit: HabitItem,
  nextIsCompleted: boolean,
  usesBadHabitJoker: boolean
) {
  if (habit.type === 'good') {
    if (nextIsCompleted) {
      return { enemyDelta: -(habit.positiveStreak + 1), playerDelta: 0 };
    }

    return { enemyDelta: habit.positiveStreak, playerDelta: 0 };
  }

  if (usesBadHabitJoker) {
    return { enemyDelta: 0, playerDelta: 0 };
  }

  if (nextIsCompleted) {
    return { enemyDelta: 0, playerDelta: -(habit.negativeStreak + 1) };
  }

  return { enemyDelta: 0, playerDelta: habit.negativeStreak };
}

// Aktualisiert die Habit-Counter bei einem Toggle für den aktuellen Tag.
function updateHabitCountersForToggle(
  habits: HabitItem[],
  habitId: string,
  nextIsCompleted: boolean,
  usesBadHabitJoker: boolean
): HabitItem[] {
  return habits.map((habit) => {
    if (habit.id !== habitId) {
      return habit;
    }

    if (habit.type === 'good') {
      if (nextIsCompleted) {
        return {
          ...habit,
          positiveStreak: habit.positiveStreak + 1,
        };
      }

      return {
        ...habit,
        positiveStreak: Math.max(0, habit.positiveStreak - 1),
      };
    }

    if (nextIsCompleted) {
      if (usesBadHabitJoker) {
        return habit;
      }

      return {
        ...habit,
        negativeStreak: habit.negativeStreak + 1,
      };
    }

    if (usesBadHabitJoker) {
      return habit;
    }

    return {
      ...habit,
      negativeStreak: Math.max(0, habit.negativeStreak - 1),
    };
  });
}

// Schließt den aktuellen Tag ab und berechnet Streaks plus Schweinehund-Heilung.
function resolveDayEnd(
  habits: HabitItem[],
  progress: RunDailyProgress,
  jokers: Record<string, number>
) {
  let enemyHealAmount = 0;
  let playerHealAmount = 0;

  const nextJokers = { ...jokers };

  const nextHabits = habits.map((habit) => {
    const isCompleted = progress[habit.id]?.completedToday ?? false;

    if (isCompleted) {
      return habit;
    }

    if (habit.type === 'good') {
      const currentJoker = nextJokers[habit.id] ?? getWeeklyJokerCount(habit);

      if (currentJoker > 0) {
        nextJokers[habit.id] = currentJoker - 1;
        return habit;
      }

      const nextNegativeStreak = habit.negativeStreak + 1;
      enemyHealAmount += nextNegativeStreak;

      return {
        ...habit,
        negativeStreak: nextNegativeStreak,
      };
    }

    if (habit.type === 'bad') {
      const nextPositiveStreak = habit.positiveStreak + 1;
      playerHealAmount += nextPositiveStreak;

      return {
        ...habit,
        positiveStreak: nextPositiveStreak,
      };
    }

    return {
      ...habit,
      negativeStreak: habit.negativeStreak + 1,
    };
  });

  return { nextHabits, nextJokers, enemyHealAmount, playerHealAmount };
}

// Prüft, ob ein Run abgeschlossen ist (Sieg oder Niederlage).
function isRunFinished(playerHP: number, enemyHP: number): boolean {
  return playerHP <= 0 || enemyHP <= 0;
}

// Erzeugt eine neue Habit-Entität mit initialen Streak-Werten.
function createHabit(title: string, targetPerWeek: number, type: HabitType): HabitItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    targetPerWeek,
    type,
    positiveStreak: 0,
    negativeStreak: 0,
  };
}

// Setzt bei allen Gewohnheiten positive und negative Counter auf 0.
function resetAllHabitCounters(habits: HabitItem[]): HabitItem[] {
  return habits.map((habit) => {
    return {
      ...habit,
      positiveStreak: 0,
      negativeStreak: 0,
    };
  });
}

// Stellt Habit- und Run-Logik zentral für die gesamte App bereit.
export function GameProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [run, setRun] = useState<RunState>(createInactiveRun());

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

    const currentProgressEntry = run.dailyProgress[habitId] ?? {
      completedToday: false,
      usedJokerToday: false,
    };
    const nextProgress = toggleDailyProgress(run.dailyProgress, habitId);
    const nextIsCompleted = nextProgress[habitId]?.completedToday ?? false;
    const currentJokerCount = run.weeklyJokers[habitId] ?? getWeeklyJokerCount(targetHabit);

    const consumeBadHabitJoker =
      targetHabit.type === 'bad' &&
      nextIsCompleted &&
      currentJokerCount > 0;

    const restoreBadHabitJoker =
      targetHabit.type === 'bad' &&
      !nextIsCompleted &&
      currentProgressEntry.usedJokerToday;

    const usesBadHabitJoker = consumeBadHabitJoker || restoreBadHabitJoker;

    const hpDelta = getToggleHPDelta(targetHabit, nextIsCompleted, usesBadHabitJoker);
    const nextHabits = updateHabitCountersForToggle(
      habits,
      habitId,
      nextIsCompleted,
      usesBadHabitJoker
    );
    const nextJokers = {
      ...run.weeklyJokers,
      [habitId]: consumeBadHabitJoker
        ? currentJokerCount - 1
        : restoreBadHabitJoker
          ? currentJokerCount + 1
          : currentJokerCount,
    };
    const nextProgressEntry = {
      completedToday: nextIsCompleted,
      usedJokerToday: consumeBadHabitJoker,
    };
    const nextProgressWithJokerInfo = {
      ...nextProgress,
      [habitId]: nextProgressEntry,
    };
    const nextHP = {
      playerHP: clampHP(run.playerHP + hpDelta.playerDelta),
      enemyHP: clampHP(run.enemyHP + hpDelta.enemyDelta),
    };

    setHabits(nextHabits);

    if (isRunFinished(nextHP.playerHP, nextHP.enemyHP)) {
      setHabits((currentHabits) => resetAllHabitCounters(currentHabits));
      setRun(createInactiveRun());
      return;
    }

    setRun({
      ...run,
      weeklyJokers: nextJokers,
      dailyProgress: nextProgressWithJokerInfo,
      playerHP: nextHP.playerHP,
      enemyHP: nextHP.enemyHP,
    });
  }, [habits, run]);

  const value = useMemo(() => {
    return {
      habits,
      run,
      maxHP: MAX_HP,
      addHabit,
      startRun,
      advanceRunDayForDevelopment,
      endRun,
      resetRun,
      toggleHabitForToday,
    };
  }, [addHabit, advanceRunDayForDevelopment, endRun, habits, resetRun, run, startRun, toggleHabitForToday]);

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
