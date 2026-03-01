import { clampHP, getWeeklyJokerCount } from '@/context/game/run-helpers';
import type { HabitItem, RunDailyProgress, RunState } from '@/context/game/types';

export type ToggleCalculationResult = {
  nextHabits: HabitItem[];
  nextRun: RunState;
  shouldFinishRun: boolean;
};

type HabitProgressEntry = {
  completedToday: boolean;
  usedJokerToday: boolean;
};

// Liefert den Default-Progress für einen Habit-Eintrag.
function createDefaultProgressEntry(): HabitProgressEntry {
  return { completedToday: false, usedJokerToday: false };
}

// Schaltet den Tagesstatus einer Gewohnheit um.
function toggleDailyProgress(progress: RunDailyProgress, habitId: string): RunDailyProgress {
  const currentEntry = progress[habitId] ?? createDefaultProgressEntry();

  return {
    ...progress,
    [habitId]: {
      completedToday: !currentEntry.completedToday,
      usedJokerToday: false,
    },
  };
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

// Aktualisiert die Habit-Counter bei einem Toggle.
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
        return { ...habit, positiveStreak: habit.positiveStreak + 1 };
      }

      return { ...habit, positiveStreak: Math.max(0, habit.positiveStreak - 1) };
    }

    if (nextIsCompleted) {
      if (usesBadHabitJoker) {
        return habit;
      }

      return { ...habit, negativeStreak: habit.negativeStreak + 1 };
    }

    if (usesBadHabitJoker) {
      return habit;
    }

    return { ...habit, negativeStreak: Math.max(0, habit.negativeStreak - 1) };
  });
}

// Ermittelt Joker-Verbrauch und Joker-Rückgabe für Bad-Habit-Toggles.
function getBadHabitJokerUsage(
  habit: HabitItem,
  nextIsCompleted: boolean,
  currentJokerCount: number,
  usedJokerToday: boolean
) {
  const consumeBadHabitJoker =
    habit.type === 'bad' &&
    nextIsCompleted &&
    currentJokerCount > 0;

  const restoreBadHabitJoker =
    habit.type === 'bad' &&
    !nextIsCompleted &&
    usedJokerToday;

  return {
    consumeBadHabitJoker,
    restoreBadHabitJoker,
    usesBadHabitJoker: consumeBadHabitJoker || restoreBadHabitJoker,
  };
}

// Berechnet den nächsten Joker-Wert für ein Habit.
function getNextJokerCount(
  currentJokerCount: number,
  consumeBadHabitJoker: boolean,
  restoreBadHabitJoker: boolean
): number {
  if (consumeBadHabitJoker) {
    return currentJokerCount - 1;
  }

  if (restoreBadHabitJoker) {
    return currentJokerCount + 1;
  }

  return currentJokerCount;
}

// Baut den Progress-Eintrag für das getogglete Habit.
function createNextProgressEntry(
  nextIsCompleted: boolean,
  consumeBadHabitJoker: boolean
): HabitProgressEntry {
  return {
    completedToday: nextIsCompleted,
    usedJokerToday: consumeBadHabitJoker,
  };
}

// Prüft, ob ein Run abgeschlossen ist (Sieg oder Niederlage).
function isRunFinished(playerHP: number, enemyHP: number): boolean {
  return playerHP <= 0 || enemyHP <= 0;
}

// Berechnet alle Folgewerte eines Habit-Toggles.
export function calculateToggleResult(
  habits: HabitItem[],
  run: RunState,
  targetHabit: HabitItem,
  habitId: string
): ToggleCalculationResult {
  const currentProgressEntry = run.dailyProgress[habitId] ?? createDefaultProgressEntry();
  const nextProgress = toggleDailyProgress(run.dailyProgress, habitId);
  const nextIsCompleted = nextProgress[habitId]?.completedToday ?? false;
  const currentJokerCount = run.weeklyJokers[habitId] ?? getWeeklyJokerCount(targetHabit);
  const jokerUsage = getBadHabitJokerUsage(
    targetHabit,
    nextIsCompleted,
    currentJokerCount,
    currentProgressEntry.usedJokerToday
  );

  const hpDelta = getToggleHPDelta(targetHabit, nextIsCompleted, jokerUsage.usesBadHabitJoker);
  const nextHabits = updateHabitCountersForToggle(
    habits,
    habitId,
    nextIsCompleted,
    jokerUsage.usesBadHabitJoker
  );
  const nextRun = {
    ...run,
    weeklyJokers: {
      ...run.weeklyJokers,
      [habitId]: getNextJokerCount(
        currentJokerCount,
        jokerUsage.consumeBadHabitJoker,
        jokerUsage.restoreBadHabitJoker
      ),
    },
    dailyProgress: {
      ...nextProgress,
      [habitId]: createNextProgressEntry(nextIsCompleted, jokerUsage.consumeBadHabitJoker),
    },
    playerHP: clampHP(run.playerHP + hpDelta.playerDelta),
    enemyHP: clampHP(run.enemyHP + hpDelta.enemyDelta),
  };

  return {
    nextHabits,
    nextRun,
    shouldFinishRun: isRunFinished(nextRun.playerHP, nextRun.enemyHP),
  };
}
