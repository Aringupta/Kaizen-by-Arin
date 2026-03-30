"use client";

import { useState } from "react";
import DaySelector from "./DaySelector";

interface HabitItemProps {
  name: string;
  activeDays: number[];
  currentStreak: number;
  completed: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdateDays: (days: number[]) => void;
  inactive?: boolean;
  schedule?: string;
}

export default function HabitItem({
  name, activeDays, currentStreak, completed, onToggle, onRemove, onUpdateDays,
  inactive, schedule,
}: HabitItemProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <li className={`border-b border-rule${inactive ? " opacity-40" : ""}`}>
      <div className="flex items-center">
        {inactive ? (
          <div className="flex-1 flex items-center gap-4 py-4">
            <span className="w-5 h-5 flex-shrink-0" />
            <span className="font-body text-base text-muted">{name}</span>
            {schedule && (
              <span className="font-ui text-xs text-muted/70">&mdash; {schedule}</span>
            )}
          </div>
        ) : (
          <button
            onClick={onToggle}
            className={`flex-1 flex items-center gap-4 py-5 text-left cursor-pointer ${
              completed ? "opacity-40" : ""
            }`}
          >
            <span
              className={`w-5 h-5 border rounded-sm flex-shrink-0 flex items-center justify-center ${
                completed ? "border-muted bg-foreground" : "border-foreground"
              }`}
            >
              {completed && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.5">
                  <polyline points="2.5,6 5,9 9.5,3" />
                </svg>
              )}
            </span>
            <span className={`font-body text-lg ${completed ? "line-through" : ""}`}>
              {name}
            </span>
          </button>
        )}

        {!inactive && currentStreak > 0 && (
          <span className="font-ui text-xs text-muted tabular-nums mr-2">
            {currentStreak}d
          </span>
        )}

        {confirmRemove ? (
          <div className="flex items-center gap-3 pr-1">
            <button
              onClick={onRemove}
              className="font-ui text-xs uppercase tracking-widest text-foreground cursor-pointer"
            >
              remove
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="font-ui text-xs uppercase tracking-widest text-muted cursor-pointer"
            >
              cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(!editing)}
              className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label={`Edit schedule for ${name}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="3" r="1" />
                <circle cx="7" cy="7" r="1" />
                <circle cx="7" cy="11" r="1" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmRemove(true)}
              className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label={`Remove ${name}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="pb-4 pl-9">
          <p className="font-ui text-xs uppercase tracking-widest text-muted mb-2">repeat</p>
          <DaySelector activeDays={activeDays} onChange={onUpdateDays} />
        </div>
      )}
    </li>
  );
}
