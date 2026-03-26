"use client";

import { useState } from "react";

interface HabitItemProps {
  name: string;
  completed: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

export default function HabitItem({ name, completed, onToggle, onRemove }: HabitItemProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <li className="flex items-center border-b border-rule">
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
      )}
    </li>
  );
}
