export type HabitCategory = "Wellness" | "Work" | "Personal";

export const CATEGORY_ORDER: HabitCategory[] = ["Wellness", "Work", "Personal"];

export interface Habit {
  name: string;
  category: HabitCategory;
  activeDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  currentStreak: number;
  longestStreak: number;
  completions: Record<string, boolean>; // YYYY-MM-DD → true
}
