import type { HabitItem, HabitType } from '@/context/game/types';

// Erzeugt eine neue Gewohnheit mit initialen Counter-Werten.
export function createHabit(title: string, targetPerWeek: number, type: HabitType): HabitItem {
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
export function resetAllHabitCounters(habits: HabitItem[]): HabitItem[] {
  return habits.map((habit) => {
    return {
      ...habit,
      positiveStreak: 0,
      negativeStreak: 0,
    };
  });
}

// Entfernt eine Gewohnheit über ihre ID aus der Liste.
export function removeHabitById(habits: HabitItem[], habitId: string): HabitItem[] {
  return habits.filter((habit) => habit.id !== habitId);
}
