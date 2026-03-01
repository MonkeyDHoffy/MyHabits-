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
