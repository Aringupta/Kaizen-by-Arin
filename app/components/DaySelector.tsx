"use client";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface DaySelectorProps {
  activeDays: number[];
  onChange: (days: number[]) => void;
}

export default function DaySelector({ activeDays, onChange }: DaySelectorProps) {
  function toggle(day: number) {
    if (activeDays.includes(day)) {
      onChange(activeDays.filter((d) => d !== day));
    } else {
      onChange([...activeDays, day].sort());
    }
  }

  return (
    <div className="flex gap-1.5">
      {DAY_LABELS.map((label, i) => {
        const active = activeDays.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={`w-7 h-7 rounded-full font-ui text-xs cursor-pointer ${
              active
                ? "bg-foreground text-background"
                : "border border-rule text-muted hover:border-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
