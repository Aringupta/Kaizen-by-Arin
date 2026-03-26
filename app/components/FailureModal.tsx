"use client";

import { useState } from "react";

export type FailureReason = "Lazy" | "Forgot" | "Too tired" | "No time";

const REASONS: FailureReason[] = ["Lazy", "Forgot", "Too tired", "No time"];

interface FailureModalProps {
  missedHabits: string[];
  onConfirm: (reason: FailureReason) => void;
}

export default function FailureModal({ missedHabits, onConfirm }: FailureModalProps) {
  const [selected, setSelected] = useState<FailureReason | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background w-full max-w-md mx-6 px-8 py-10 sm:px-10 sm:py-12">

        <p className="font-heading text-3xl sm:text-4xl font-normal tracking-tight text-center">
          You broke your standard.
        </p>

        <hr className="border-rule my-6 mx-auto max-w-[4rem]" />

        <div className="mb-8">
          <p className="font-ui text-xs uppercase tracking-widest text-muted text-center mb-3">
            incomplete
          </p>
          <ul className="text-center">
            {missedHabits.map((h) => (
              <li key={h} className="font-body text-base text-foreground leading-relaxed">
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-body text-base text-center mb-6">
          Why did you miss?
        </p>

        <div className="flex flex-col gap-2 mb-8">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className={`w-full py-3 px-4 border text-left font-ui text-sm uppercase tracking-widest cursor-pointer ${
                selected === reason
                  ? "border-foreground bg-foreground text-background"
                  : "border-rule text-foreground hover:border-foreground"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className={`w-full py-3 font-ui text-sm uppercase tracking-widest cursor-pointer ${
            selected
              ? "bg-foreground text-background"
              : "bg-rule text-muted cursor-not-allowed"
          }`}
        >
          Accept
        </button>

      </div>
    </div>
  );
}
