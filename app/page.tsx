"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import HabitItem from "./components/HabitItem";
import DaySelector from "./components/DaySelector";
import FailureModal, { type FailureReason } from "./components/FailureModal";
import type { Habit } from "./lib/types";
import { save, load } from "./lib/storage";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const DEFAULT_HABITS: Habit[] = [
  { name: "Hair Treatment", activeDays: ALL_DAYS, currentStreak: 0, longestStreak: 0, lastCompletedDate: null },
  { name: "Gym", activeDays: [1, 2, 3, 4], currentStreak: 0, longestStreak: 0, lastCompletedDate: null },
  { name: "Sleep Target", activeDays: ALL_DAYS, currentStreak: 0, longestStreak: 0, lastCompletedDate: null },
];

interface CompletionState {
  date: string;
  completed: string[];
}

interface FailureRecord {
  date: string;
  missedHabits: string[];
  reason: FailureReason;
}

interface EvalState {
  lastEvaluatedDate: string | null;
  totalDays: number;
  failures: FailureRecord[];
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTodayDow(): number {
  return new Date().getDay();
}

function getIdentityLine(hadFailure: boolean, minStreak: number): string {
  if (hadFailure) return "This is not who you said you are.";
  if (minStreak >= 14) return "This is who you are now.";
  if (minStreak >= 7) return "You don\u2019t miss.";
  if (minStreak >= 3) return "Keep proving it.";
  if (minStreak >= 1) return "Prove it again today.";
  return "The discipline to improve daily without exception.";
}

function getRealityLine(
  failures: FailureRecord[],
  totalDays: number,
  habits: Habit[],
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

  // Per-habit longest vs current
  for (const h of habits) {
    if (h.longestStreak > h.currentStreak && h.longestStreak >= 3) {
      lines.push(`"${h.name}" best: ${h.longestStreak}d. Now: ${h.currentStreak}d.`);
      break;
    }
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
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [evalState, setEvalState] = useState<EvalState>({
    lastEvaluatedDate: null, totalDays: 0, failures: [],
  });
  const [adding, setAdding] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [newHabitDays, setNewHabitDays] = useState<number[]>(ALL_DAYS);
  const [showFailure, setShowFailure] = useState(false);
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const todayDow = getTodayDow();
  const today = getToday();
  const todaysHabits = habits.filter((h) => h.activeDays.includes(todayDow));

  const completedCount = todaysHabits.filter((h) => completed.has(h.name)).length;
  const totalCount = todaysHabits.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;
  const missedHabits = todaysHabits.filter((h) => !completed.has(h.name)).map((h) => h.name);
  const someComplete = completedCount > 0 && !allComplete;
  const neutralDay = totalCount === 0;
  const alreadyEvaluated = evalState.lastEvaluatedDate === today;

  const tensionColor =
    neutralDay
      ? "bg-rule"
      : allComplete
        ? "bg-tension-complete"
        : completedCount > 0
          ? "bg-tension-partial"
          : "bg-tension-none";

  // Derive identity from per-habit streaks of today's habits
  const lastWasFailure = evalState.failures.length > 0 &&
    evalState.failures[evalState.failures.length - 1].date === evalState.lastEvaluatedDate;
  const minStreak = todaysHabits.length > 0
    ? Math.min(...todaysHabits.map((h) => h.currentStreak))
    : 0;
  const hasAnyStreak = todaysHabits.some((h) => h.currentStreak > 0);
  const showWarning = hasAnyStreak && someComplete && !allComplete;

  // Hydrate from localStorage
  useEffect(() => {
    // Habits
    const storedHabits = load<Habit[] | string[]>("habits");
    if (storedHabits && storedHabits.length > 0) {
      if (typeof storedHabits[0] === "string") {
        // Migrate old string[] format
        const migrated: Habit[] = (storedHabits as string[]).map((name) => ({
          name, activeDays: ALL_DAYS, currentStreak: 0, longestStreak: 0, lastCompletedDate: null,
        }));
        setHabits(migrated);
      } else {
        // Migrate old Habit format without streak fields
        const migrated: Habit[] = (storedHabits as Habit[]).map((h) => ({
          ...h,
          currentStreak: h.currentStreak ?? 0,
          longestStreak: h.longestStreak ?? 0,
          lastCompletedDate: h.lastCompletedDate ?? null,
        }));
        setHabits(migrated);
      }
    }

    // Completions
    const storedCompletion = load<CompletionState>("completion");
    if (storedCompletion && storedCompletion.date === getToday()) {
      setCompleted(new Set(storedCompletion.completed));
    }

    // Eval state (migrated from old streak data)
    const storedEval = load<EvalState>("eval");
    if (storedEval) {
      setEvalState(storedEval);
    } else {
      // Migrate from old global streak if it exists
      const oldStreak = load<{
        totalDays?: number;
        lastEvaluatedDate?: string | null;
        failures?: FailureRecord[];
      }>("streak");
      if (oldStreak) {
        setEvalState({
          lastEvaluatedDate: oldStreak.lastEvaluatedDate ?? null,
          totalDays: oldStreak.totalDays ?? 0,
          failures: oldStreak.failures ?? [],
        });
      }
    }

    setHydrated(true);
  }, []);

  // Persist habits
  useEffect(() => {
    if (hydrated) save("habits", habits);
  }, [habits, hydrated]);

  // Persist completions
  useEffect(() => {
    if (hydrated) {
      save("completion", { date: getToday(), completed: Array.from(completed) });
    }
  }, [completed, hydrated]);

  // Persist eval state
  useEffect(() => {
    if (hydrated) save("eval", evalState);
  }, [evalState, hydrated]);

  // Rotate reality line every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-evaluate when all today's habits are completed
  useEffect(() => {
    if (allComplete && !alreadyEvaluated) {
      evaluateDay(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete, alreadyEvaluated]);

  const identityLine = useMemo(
    () => getIdentityLine(lastWasFailure, minStreak),
    [lastWasFailure, minStreak]
  );

  const realityLine = useMemo(
    () => getRealityLine(evalState.failures, evalState.totalDays, habits),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [evalState.failures, evalState.totalDays, habits, tick]
  );

  function evaluateDay(allDone: boolean, missed?: string[], reason?: FailureReason) {
    if (neutralDay) return;
    if (alreadyEvaluated) return;

    const todayStr = getToday();

    // Update per-habit streaks
    setHabits((prev) =>
      prev.map((h) => {
        // Only evaluate habits scheduled for today
        if (!h.activeDays.includes(todayDow)) return h;

        if (completed.has(h.name)) {
          const newStreak = h.currentStreak + 1;
          return {
            ...h,
            currentStreak: newStreak,
            longestStreak: Math.max(h.longestStreak, newStreak),
            lastCompletedDate: todayStr,
          };
        }

        // Incomplete — reset
        return { ...h, currentStreak: 0 };
      })
    );

    // Update eval state
    setEvalState((prev) => {
      const next: EvalState = {
        lastEvaluatedDate: todayStr,
        totalDays: prev.totalDays + 1,
        failures: prev.failures,
      };

      if (!allDone && missed && reason) {
        next.failures = [
          ...prev.failures,
          { date: todayStr, missedHabits: missed, reason },
        ];
      }

      return next;
    });
  }

  function handleToggle(habitName: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(habitName)) {
        next.delete(habitName);
      } else {
        next.add(habitName);
      }
      return next;
    });
  }

  function handleAdd() {
    const trimmed = newHabit.trim();
    if (trimmed && !habits.some((h) => h.name === trimmed) && newHabitDays.length > 0) {
      setHabits([...habits, {
        name: trimmed,
        activeDays: newHabitDays,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
      }]);
    }
    setNewHabit("");
    setNewHabitDays(ALL_DAYS);
    setAdding(false);
  }

  function handleRemove(habitName: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.delete(habitName);
      return next;
    });
    setHabits(habits.filter((h) => h.name !== habitName));
  }

  function handleUpdateDays(habitName: string, days: number[]) {
    setHabits(habits.map((h) =>
      h.name === habitName ? { ...h, activeDays: days } : h
    ));
  }

  function openAddInput() {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function simulateDayEnd() {
    if (neutralDay) return;
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

  if (!hydrated) {
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
            lastWasFailure ? "text-tension-none" : "text-foreground"
          }`}>
            {identityLine}
          </p>
        </section>

        <hr className="border-rule mb-12" />

        {/* Pre-failure Warning */}
        {showWarning && (
          <p className="text-center font-body text-sm text-tension-none uppercase tracking-widest mb-8">
            You are about to lose a streak.
          </p>
        )}

        {/* Habit Section */}
        <section className="mb-12">
          {neutralDay ? (
            <p className="text-center font-body text-muted text-base py-8">
              No habits scheduled for today.
            </p>
          ) : (
            <ul className="flex flex-col">
              {todaysHabits.map((habit) => (
                <HabitItem
                  key={habit.name}
                  name={habit.name}
                  activeDays={habit.activeDays}
                  currentStreak={habit.currentStreak}
                  completed={completed.has(habit.name)}
                  onToggle={() => handleToggle(habit.name)}
                  onRemove={() => handleRemove(habit.name)}
                  onUpdateDays={(days) => handleUpdateDays(habit.name, days)}
                />
              ))}
            </ul>
          )}

          {/* Inline Add */}
          {adding ? (
            <div className="border-b border-rule py-5">
              <div className="flex items-center gap-4">
                <span className="w-5 h-5 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setAdding(false); setNewHabit(""); setNewHabitDays(ALL_DAYS); }
                  }}
                  placeholder="new habit"
                  className="flex-1 font-body text-lg bg-transparent outline-none placeholder:text-muted/50"
                />
              </div>
              <div className="mt-3 pl-9 flex items-center gap-4">
                <p className="font-ui text-xs uppercase tracking-widest text-muted">repeat</p>
                <DaySelector activeDays={newHabitDays} onChange={setNewHabitDays} />
              </div>
              <div className="mt-3 pl-9 flex gap-3">
                <button
                  onClick={handleAdd}
                  className="font-ui text-xs uppercase tracking-widest text-foreground cursor-pointer"
                >
                  add
                </button>
                <button
                  onClick={() => { setAdding(false); setNewHabit(""); setNewHabitDays(ALL_DAYS); }}
                  className="font-ui text-xs uppercase tracking-widest text-muted cursor-pointer"
                >
                  cancel
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </section>

        {/* Tension Bar */}
        <div className={`w-full h-0.5 ${tensionColor} mb-8`} />

        {/* Completion Count + Simulate */}
        <div className="flex items-center justify-center gap-6 mb-10">
          <p className="font-ui text-muted text-xs uppercase tracking-widest">
            {completedCount}/{totalCount} completed
          </p>
          {!neutralDay && (
            <button
              onClick={simulateDayEnd}
              className="font-ui text-muted text-xs uppercase tracking-widest border-b border-dashed border-muted hover:text-foreground hover:border-foreground cursor-pointer"
            >
              end day
            </button>
          )}
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
