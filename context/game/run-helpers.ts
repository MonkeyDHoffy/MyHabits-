import { MAX_HP } from '@/context/game/constants';
import type { HabitItem, RunDailyProgress, RunState } from '@/context/game/types';

// Erzeugt den inaktiven Startzustand eines Runs.
export function createInactiveRun(): RunState {
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
export function getWeeklyJokerCount(habit: HabitItem): number {
  if (habit.type === 'good') {
    return Math.max(0, 7 - habit.targetPerWeek);
  }

  return Math.max(0, habit.targetPerWeek);
}

// Erzeugt den wöchentlichen Joker-Status für alle Gewohnheiten.
export function createWeeklyJokers(habits: HabitItem[]): Record<string, number> {
  const jokers: Record<string, number> = {};

  habits.forEach((habit) => {
    jokers[habit.id] = getWeeklyJokerCount(habit);
  });

  return jokers;
}

// Erzeugt den Tagesstatus für alle vorhandenen Gewohnheiten.
export function createDailyProgress(habits: HabitItem[]): RunDailyProgress {
  const progress: RunDailyProgress = {};

  habits.forEach((habit) => {
    progress[habit.id] = { completedToday: false, usedJokerToday: false };
  });

  return progress;
}

// Klemmt einen HP-Wert auf den Bereich 0 bis MAX_HP.
export function clampHP(value: number): number {
  return Math.max(0, Math.min(MAX_HP, value));
}
