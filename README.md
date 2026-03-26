# kaizen

A single-page behavioral enforcement app. Not a habit tracker. A mirror.

Built to create psychological pressure to complete daily habits, make failure visible and uncomfortable, and reinforce identity through consistency.

---

## Philosophy

- Reinforce identity: "I don't miss."
- Make failure intentional, not passive.
- No rewards, no gamification, no soft language.
- Clarity over features.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **localStorage** for persistence
- No external UI libraries

---

## Project Structure

```
app/
  page.tsx                  # Single page (all UI lives here)
  layout.tsx                # Root layout, font loading, metadata
  globals.css               # Tailwind config, CSS variables, color tokens
  components/
    HabitItem.tsx            # Individual habit row (toggle, remove)
    FailureModal.tsx         # Accountability modal on failed day
  hooks/
    useStreak.ts             # Streak tracking state + evaluation logic
  lib/
    storage.ts               # localStorage wrapper (save/load/remove)
```

---

## Features

### Habit Management
- Add/remove habits dynamically
- Default habits: Hair Treatment, Gym, Sleep Target
- Inline text input to add, confirm/cancel to remove
- No categories, no colors, no icons. Just text.

### Completion Tracking
- Tap a habit to mark complete (toggle)
- Completed habits show line-through + reduced opacity
- Completions are date-stamped (auto-clear on new day)

### Tension Bar
A thin horizontal bar below the habit list. Color reflects today's status:
- **Red** -- nothing done
- **Yellow** -- partially done
- **Green** -- all complete

### Streak System
- A day is successful ONLY if all habits are completed
- Success increments `currentStreak`, failure resets it to 0
- `longestStreak` is preserved across failures
- Only evaluates once per calendar day (no double-counting)
- "End day" button to simulate day-end for testing

### Failure Accountability
When a day ends with incomplete habits:
1. A full-screen modal appears: "You broke your standard."
2. Lists the specific missed habits
3. Forces selection of a reason: Lazy, Forgot, Too tired, No time
4. No dismiss, no escape. Must accept responsibility.
5. Reason is stored in failure history

### Psychological Feedback

**Identity Line** (header area, replaces definition):
| Condition | Message |
|---|---|
| After failure | "This is not who you said you are." |
| 14+ day streak | "This is who you are now." |
| 7+ day streak | "You don't miss." |
| 3+ day streak | "Keep proving it." |
| 1+ day streak | "Prove it again today." |
| No history | "The discipline to improve daily without exception." |

**Pre-Failure Warning** -- appears in red when you have an active streak but haven't completed all habits:
> YOU ARE ABOUT TO LOSE YOUR STREAK.

**Reality Line** (bottom, rotates every 30s) -- data-driven insights:
- "You have failed 33% of your days."
- "You fail 'Gym' 40% of the time."
- "Your most common excuse: 'lazy'."
- "Your best was 7 days. You're at 2."
- "5 days. No failures. Don't start now."

Only shows lines when there's enough data to back them.

---

## Persistence

All state is saved to `localStorage` under the `kaizen:` prefix:

| Key | Contents | Triggers |
|---|---|---|
| `kaizen:habits` | Habit list | Add/remove habit |
| `kaizen:completion` | Today's date + checked habits | Toggle completion |
| `kaizen:streak` | Streak state, failure records | Day evaluation |

- Completions auto-clear when the date changes
- Streak and failure history persist indefinitely
- App shows blank until hydrated (no flash of default state)

---

## Design

Aesthetic based on a minimalist dictionary-definition poster:

- White background, near-black text
- Serif-forward typography
- Generous whitespace, centered composition
- Thin horizontal rules as dividers

**Fonts** (Google Fonts via `next/font`):
- **Playfair Display** -- headings (`font-heading`)
- **Source Serif 4** -- body text (`font-body`)
- **Inter** -- UI elements (`font-ui`)

**Color Tokens:**
| Token | Value | Usage |
|---|---|---|
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#1a1a1a` | Primary text |
| `--muted` | `#6b6b6b` | Secondary text |
| `--rule` | `#e0e0e0` | Dividers |
| `--tension-none` | `#dc2626` | Red (no progress) |
| `--tension-partial` | `#ca8a04` | Yellow (partial) |
| `--tension-complete` | `#16a34a` | Green (all done) |

---

## Rules

- Single page only. No routing.
- No gamification, no rewards, no emojis.
- No notifications.
- No "skip" functionality.
- No backfilling past days.
- Single user, no authentication.

---

by Arin
