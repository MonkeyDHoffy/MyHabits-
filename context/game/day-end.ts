import { getWeeklyJokerCount } from '@/context/game/run-helpers';
import type { HabitItem, RunDailyProgress } from '@/context/game/types';

export type DayEndResult = {
  nextHabits: HabitItem[];
  nextJokers: Record<string, number>;
  enemyHealAmount: number;
  playerHealAmount: number;
};

// Prüft, ob ein Habit heute als erledigt markiert wurde.
function isHabitCompletedToday(progress: RunDailyProgress, habitId: string): boolean {
  return progress[habitId]?.completedToday ?? false;
}

// Verarbeitet ein verpasstes Good-Habit inklusive Joker-Logik.
function resolveMissedGoodHabit(
  habit: HabitItem,
  jokers: Record<string, number>
): { habit: HabitItem; enemyHealAmount: number } {
  const currentJoker = jokers[habit.id] ?? getWeeklyJokerCount(habit);

  if (currentJoker > 0) {
    jokers[habit.id] = currentJoker - 1;
    return { habit, enemyHealAmount: 0 };
  }

  const nextNegativeStreak = habit.negativeStreak + 1;

  return {
    habit: { ...habit, negativeStreak: nextNegativeStreak },
    enemyHealAmount: nextNegativeStreak,
  };
}

// Verarbeitet ein verpasstes Bad-Habit und berechnet Spielerheilung.
function resolveMissedBadHabit(habit: HabitItem): { habit: HabitItem; playerHealAmount: number } {
  const nextPositiveStreak = habit.positiveStreak + 1;

  return {
    habit: { ...habit, positiveStreak: nextPositiveStreak },
    playerHealAmount: nextPositiveStreak,
  };
}

// Schließt den aktuellen Tag ab und berechnet Streaks plus Heilung.
export function resolveDayEnd(
  habits: HabitItem[],
  progress: RunDailyProgress,
  jokers: Record<string, number>
): DayEndResult {
  let enemyHealAmount = 0;
  let playerHealAmount = 0;
  const nextJokers = { ...jokers };

  const nextHabits = habits.map((habit) => {
    if (isHabitCompletedToday(progress, habit.id)) {
      return habit;
    }

    if (habit.type === 'good') {
      const goodResult = resolveMissedGoodHabit(habit, nextJokers);
      enemyHealAmount += goodResult.enemyHealAmount;
      return goodResult.habit;
    }

    const badResult = resolveMissedBadHabit(habit);
    playerHealAmount += badResult.playerHealAmount;
    return badResult.habit;
  });

  return { nextHabits, nextJokers, enemyHealAmount, playerHealAmount };
}
