"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import HabitItem from "./components/HabitItem";
import FailureModal, { type FailureReason } from "./components/FailureModal";
import useStreak from "./hooks/useStreak";
import type { FailureRecord } from "./hooks/useStreak";
import { save, load } from "./lib/storage";

const DEFAULT_HABITS = ["Hair Treatment", "Gym", "Sleep Target"];

interface CompletionState {
  date: string;
  completed: string[];
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getIdentityLine(
  lastResult: "success" | "failure" | null,
  currentStreak: number
): string {
  if (lastResult === "failure") return "This is not who you said you are.";
  if (currentStreak >= 14) return "This is who you are now.";
  if (currentStreak >= 7) return "You don\u2019t miss.";
  if (currentStreak >= 3) return "Keep proving it.";
  if (currentStreak >= 1) return "Prove it again today.";
  return "The discipline to improve daily without exception.";
}

function getRealityLine(
  failures: FailureRecord[],
  totalDays: number,
  longestStreak: number,
  currentStreak: number,
): string | null {
  if (totalDays < 1) return null;

  const lines: string[] = [];

  if (totalDays >= 3) {
    const failRate = Math.round((failures.length / totalDays) * 100);
    if (failRate > 0) {
      lines.push(`You have failed ${failRate}% of your days.`);
    }
  }

  if (failures.length > 0) {
    const missCount: Record<string, number> = {};
    for (const f of failures) {
      for (const h of f.missedHabits) {
        missCount[h] = (missCount[h] || 0) + 1;
      }
    }
    const sorted = Object.entries(missCount).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] >= 2) {
      const [name, count] = sorted[0];
      const rate = Math.round((count / totalDays) * 100);
      lines.push(`You fail "${name}" ${rate}% of the time.`);
    }
  }

  if (failures.length >= 2) {
    const reasonCount: Record<string, number> = {};
    for (const f of failures) {
      reasonCount[f.reason] = (reasonCount[f.reason] || 0) + 1;
    }
    const topReason = Object.entries(reasonCount).sort((a, b) => b[1] - a[1])[0];
    if (topReason[1] >= 2) {
      lines.push(`Your most common excuse: "${topReason[0].toLowerCase()}".`);
    }
  }

  if (longestStreak > currentStreak && longestStreak >= 3) {
    lines.push(`Your best was ${longestStreak} days. You\u2019re at ${currentStreak}.`);
  }

  if (failures.length === 0 && totalDays >= 2) {
    lines.push(`${totalDays} days. No failures. Don\u2019t start now.`);
  }

  if (failures.length > 0) {
    const totalMissed = failures.reduce((sum, f) => sum + f.missedHabits.length, 0);
    lines.push(`${totalMissed} habits left incomplete across ${failures.length} failed days.`);
  }

  if (lines.length === 0) return null;

  const index = Math.floor(Date.now() / 30000) % lines.length;
  return lines[index];
}

export default function Home() {
  const [habits, setHabits] = useState<string[]>(DEFAULT_HABITS);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [showFailure, setShowFailure] = useState(false);
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentStreak, longestStreak, totalDays, lastResult, failures,
    hydrated: streakHydrated, evaluateDay,
  } = useStreak();

  // Hydrate habits and completions from localStorage
  useEffect(() => {
    const storedHabits = load<string[]>("habits");
    if (storedHabits) {
      setHabits(storedHabits);
    }

    const storedCompletion = load<CompletionState>("completion");
    if (storedCompletion && storedCompletion.date === getToday()) {
      setCompleted(new Set(storedCompletion.completed));
    }

    setHydrated(true);
  }, []);

  // Persist habits
  useEffect(() => {
    if (hydrated) {
      save("habits", habits);
    }
  }, [habits, hydrated]);

  // Persist today's completions
  useEffect(() => {
    if (hydrated) {
      const state: CompletionState = {
        date: getToday(),
        completed: Array.from(completed),
      };
      save("completion", state);
    }
  }, [completed, hydrated]);

  const completedCount = habits.filter((h) => completed.has(h)).length;
  const totalCount = habits.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;
  const missedHabits = habits.filter((h) => !completed.has(h));
  const someComplete = completedCount > 0 && !allComplete;

  const tensionColor =
    totalCount === 0
      ? "bg-rule"
      : allComplete
        ? "bg-tension-complete"
        : completedCount > 0
          ? "bg-tension-partial"
          : "bg-tension-none";

  // Rotate reality line every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-evaluate when all habits are completed
  useEffect(() => {
    if (allComplete) {
      evaluateDay(true);
    }
  }, [allComplete, evaluateDay]);

  const identityLine = useMemo(
    () => getIdentityLine(lastResult, currentStreak),
    [lastResult, currentStreak]
  );

  const realityLine = useMemo(
    () => getRealityLine(failures, totalDays, longestStreak, currentStreak),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [failures, totalDays, longestStreak, currentStreak, tick]
  );

  function handleToggle(habit: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(habit)) {
        next.delete(habit);
      } else {
        next.add(habit);
      }
      return next;
    });
  }

  function handleAdd() {
    const trimmed = newHabit.trim();
    if (trimmed && !habits.includes(trimmed)) {
      setHabits([...habits, trimmed]);
    }
    setNewHabit("");
    setAdding(false);
  }

  function handleRemove(index: number) {
    const habit = habits[index];
    setCompleted((prev) => {
      const next = new Set(prev);
      next.delete(habit);
      return next;
    });
    setHabits(habits.filter((_, i) => i !== index));
  }

  function openAddInput() {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function simulateDayEnd() {
    if (allComplete) {
      evaluateDay(true);
    } else {
      setShowFailure(true);
    }
  }

  function handleFailureConfirm(reason: FailureReason) {
    evaluateDay(false, missedHabits, reason);
    setShowFailure(false);
    setCompleted(new Set());
  }

  const streakLabel =
    currentStreak === 1 ? "1 day" : `${currentStreak} days`;

  const streakMessage =
    lastResult === "failure"
      ? "You broke your standard."
      : currentStreak > 0
        ? `You haven\u2019t broken your streak in ${streakLabel}`
        : "You haven\u2019t started yet";

  const showWarning = currentStreak > 0 && someComplete && !allComplete;

  // Don't render until hydrated to avoid flash of default state
  if (!hydrated || !streakHydrated) {
    return <div className="flex flex-col flex-1 items-center bg-background" />;
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex flex-1 w-full max-w-2xl flex-col px-8 py-16 sm:px-12 sm:py-24">

        {/* Identity Header */}
        <section className="text-center mb-16">
          <h1 className="font-heading text-5xl sm:text-6xl font-normal tracking-tight lowercase">
            kaizen
          </h1>
          <hr className="border-rule mt-6 mb-5 mx-auto max-w-xs" />
          <p className="font-body text-muted text-base mb-4">
            noun [kai-zn] <em>Japanese</em>
          </p>
          <p className={`font-body text-lg leading-relaxed max-w-md mx-auto ${
            lastResult === "failure" ? "text-tension-none" : "text-foreground"
          }`}>
            {identityLine}
          </p>
        </section>

        {/* Streak Section */}
        <section className="text-center mb-16">
          <p className="font-heading text-6xl sm:text-7xl font-normal tracking-tight">
            {streakLabel}
          </p>
          <p className={`font-body text-sm mt-3 uppercase tracking-widest ${
            lastResult === "failure" ? "text-tension-none" : "text-muted"
          }`}>
            {streakMessage}
          </p>
          <p className="font-ui text-muted text-xs mt-6 uppercase tracking-widest">
            Longest: {longestStreak === 1 ? "1 day" : `${longestStreak} days`}
          </p>
        </section>

        <hr className="border-rule mb-12" />

        {/* Pre-failure Warning */}
        {showWarning && (
          <p className="text-center font-body text-sm text-tension-none uppercase tracking-widest mb-8">
            You are about to lose your streak.
          </p>
        )}

        {/* Habit Section */}
        <section className="mb-12">
          <ul className="flex flex-col">
            {habits.map((habit, i) => (
              <HabitItem
                key={habit}
                name={habit}
                completed={completed.has(habit)}
                onToggle={() => handleToggle(habit)}
                onRemove={() => handleRemove(i)}
              />
            ))}

            {/* Inline Add */}
            {adding ? (
              <li className="flex items-center gap-4 py-5 border-b border-rule">
                <span className="w-5 h-5 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setAdding(false); setNewHabit(""); }
                  }}
                  onBlur={handleAdd}
                  placeholder="new habit"
                  className="flex-1 font-body text-lg bg-transparent outline-none placeholder:text-muted/50"
                />
              </li>
            ) : (
              <li>
                <button
                  onClick={openAddInput}
                  className="w-full flex items-center gap-4 py-5 border-b border-rule text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="7" y1="2" x2="7" y2="12" />
                      <line x1="2" y1="7" x2="12" y2="7" />
                    </svg>
                  </span>
                  <span className="font-ui text-sm uppercase tracking-widest">Add habit</span>
                </button>
              </li>
            )}
          </ul>
        </section>

        {/* Tension Bar */}
        <div className={`w-full h-0.5 ${tensionColor} mb-8`} />

        {/* Completion Count + Simulate */}
        <div className="flex items-center justify-center gap-6 mb-10">
          <p className="font-ui text-muted text-xs uppercase tracking-widest">
            {completedCount}/{totalCount} completed
          </p>
          <button
            onClick={simulateDayEnd}
            className="font-ui text-muted text-xs uppercase tracking-widest border-b border-dashed border-muted hover:text-foreground hover:border-foreground cursor-pointer"
          >
            end day
          </button>
        </div>

        {/* Reality Line */}
        {realityLine && (
          <p className="text-center font-body text-sm text-muted italic mb-10">
            {realityLine}
          </p>
        )}

        {/* Footer */}
        <footer className="text-center mt-auto">
          <p className="font-ui text-muted text-xs uppercase tracking-widest">
            by Arin
          </p>
        </footer>

      </main>

      {/* Failure Modal */}
      {showFailure && (
        <FailureModal
          missedHabits={missedHabits}
          onConfirm={handleFailureConfirm}
        />
      )}
    </div>
  );
}
