export interface Habit {
  name: string;
  activeDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}
