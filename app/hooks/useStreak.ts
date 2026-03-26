"use client";

import { useState, useCallback, useEffect } from "react";
import type { FailureReason } from "../components/FailureModal";
import { save, load } from "../lib/storage";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface FailureRecord {
  date: string;
  missedHabits: string[];
  reason: FailureReason;
}

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastEvaluatedDate: string | null;
  lastResult: "success" | "failure" | null;
  failures: FailureRecord[];
}

const INITIAL_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  totalDays: 0,
  lastEvaluatedDate: null,
  lastResult: null,
  failures: [],
};

const STORAGE_KEY = "streak";

export default function useStreak() {
  const [streak, setStreak] = useState<StreakState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = load<StreakState>(STORAGE_KEY);
    if (stored) {
      setStreak(stored);
    }
    setHydrated(true);
  }, []);

  // Persist on every change (after hydration)
  useEffect(() => {
    if (hydrated) {
      save(STORAGE_KEY, streak);
    }
  }, [streak, hydrated]);

  const evaluateDay = useCallback(
    (allComplete: boolean, missedHabits?: string[], reason?: FailureReason) => {
      const today = getToday();

      setStreak((prev) => {
        if (prev.lastEvaluatedDate === today) return prev;

        if (allComplete) {
          const newCurrent = prev.currentStreak + 1;
          return {
            ...prev,
            currentStreak: newCurrent,
            longestStreak: Math.max(prev.longestStreak, newCurrent),
            totalDays: prev.totalDays + 1,
            lastEvaluatedDate: today,
            lastResult: "success",
          };
        }

        return {
          ...prev,
          currentStreak: 0,
          totalDays: prev.totalDays + 1,
          lastEvaluatedDate: today,
          lastResult: "failure",
          failures: [
            ...prev.failures,
            {
              date: today,
              missedHabits: missedHabits || [],
              reason: reason || "Lazy",
            },
          ],
        };
      });
    },
    []
  );

  return { ...streak, hydrated, evaluateDay };
}
