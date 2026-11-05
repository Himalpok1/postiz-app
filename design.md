# Design: Castrapid

The locked system. Every Hallmark run reads this first and all screens share it. Change it on purpose; this file is the rule. Approved by the owner on 2026-11-04 (the "blend"). Reference mock: `https://claude.ai/artifact/6BFevj4QDhjFQ74XmezjF5`.

## System
- Genre: playful
- Shape of the first page: app screen
- Theme: custom (vibe: "sunny rooms, color that means something")
- Axes: light/grotesk-sans/warm · posture: full-palette
- Light is the default. The dark toggle stays as a user choice and is not part of this design yet.

## What color means
Color always carries meaning, and never carries it alone.
- **Room color: where you are.** Each section tints the frame around one white sheet, and its nav tile always wears its color.
- **Tag color: which campaign.** A chip on every post, always with the tag's name written on it. Tags hold customer-chosen colors, so chip text must be picked for contrast. An untagged post shows no chip.
- **Status color: what state.** A small badge with an icon and a word: Draft, Scheduled, Published, Failed. A failed post offers its fix inline.
- Post cards stay neutral so a full calendar stays readable. Channel logos keep their own colors.

## Tokens
In `apps/frontend/src/app/colors.scss` and `apps/frontend/tailwind.config.cjs`. Not `--color-custom*`.
```css
:root {
  --room-calendar: #FFE27A; --room-analytics: #A5EDD6; --room-media: #FFC4D8; --room-billing: #B8DBFF; --room-settings: #FFCDA3;
  --color-paper: var(--room); --color-paper-2: #FFFEFB; --color-paper-3: #F8F6EE;
  --color-ink: #1F3329; --color-ink-2: #34493E; --color-muted: #4E6156; --color-rule: #E7E5DA;
  --color-accent: #0F6B52; --color-accent-hover: #0B5944; --color-accent-ink: #FFFEFB; --color-focus: #0F6B52;
  --tag-1: #FFCE3A; --tag-2: #FF9A85; --tag-3: #FF9CCB; --tag-4: #6FC3FF; --tag-5: #6EE0A6;
  --st-draft: #FFE9A6; --st-scheduled: #BFF1DF; --st-published: #CFE5FF; --st-failed: #FFC9B8;
  --font-display: "Bricolage Grotesque", "Noto Sans", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Onest", "Noto Sans", ui-sans-serif, system-ui, sans-serif;
  --radius-card: 14px; --radius-sheet: 28px; --radius-pill: 999px; --rule-hair: 1px; --shadow-card: none;
}
```
Spacing runs on a 4px scale. Dark text on any fill must reach 4.5:1 or better; all values above do.

## Shell
- Left rail on the room color: wordmark, room tiles, Create post, channels. On phones it becomes a scrolling top row, and Create post stays visible.
- One white sheet holds the work. No card inside a card.

## Controls
- Primary: `--color-accent` fill · pill radius · 40 to 44px
- Secondary: `--color-paper-3` fill, ink text · same radius and height
- Every control has hover, focus-visible, active and disabled states.

## Type and language
- Bricolage Grotesque for headings, Onest for everything else. Sentence case; no tracked capitals.
- The app ships in 16 languages. Scripts these faces lack (Arabic, Hebrew, Bengali, Japanese, Korean, Chinese, Georgian) need a Noto fallback, and layout uses logical properties so right-to-left works.

## Motion
- Character: brisk. Only state changes animate, using `--dur-micro` and `--dur-short`. Under reduced motion everything ends at once.

## Exports
The tokens above are the source, in `apps/frontend/src/app/colors.scss`. Tailwind names are in `apps/frontend/tailwind.config.cjs`: `bg-room`, `bg-roomCalendar` and the other rooms, `bg-paper2`, `bg-paper3`, `text-ink`, `text-muted`, `bg-accent`, `bg-stDraft` and the other statuses, `font-display`, `rounded-card`, `rounded-sheet`, `rounded-pill`. The active nav tile is white on the room color, as in the approved mock, because a tile in its own room color would vanish into the frame.
