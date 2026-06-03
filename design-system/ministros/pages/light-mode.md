# Light Mode — Page Overrides

> **PROJECT:** Ministros — Portal de Alabanza
> **Page:** Light mode token overrides (applies when `<html>` has no `dark` class)
> **Rule:** Entries here override `globals.css :root` and `MASTER.md`.

---

## Color Palette (`:root` CSS variables)

| Token | CSS value | Hex | Tailwind equiv | Role |
|-------|-----------|-----|----------------|------|
| `--base` | `212 212 216` | `#d4d4d8` | zinc-300 | Page background |
| `--card` | `228 228 231` | `#e4e4e7` | zinc-200 | Card surface — **lighter** than base |
| `--input`| `212 212 216` | `#d4d4d8` | zinc-300 | Inputs (same level as base, differentiated by border) |
| `--mark` | `161 161 170` | `#a1a1aa` | zinc-400 | Borders, strong hover |
| `--line` | `161 161 170` | `#a1a1aa` | zinc-400 | Standard borders (= mark) |
| `--hi`   | `24  24  27`  | `#18181b` | zinc-900 | Primary text |
| `--mid`  | `113 113 122` | `#71717a` | zinc-500 | Secondary text |
| `--lo`   | `161 161 170` | `#a1a1aa` | zinc-400 | Muted text |
| `--gone` | `161 161 170` | `#a1a1aa` | zinc-400 | Placeholder / ghost text |

Note: `--line`, `--mark`, `--lo`, `--gone` all resolve to the same `#a1a1aa`.
Border color and muted text intentionally share the same value in this palette.

---

## Elevation model

In light mode, elevation is achieved by going **lighter** (opposite of dark mode):

```
Background  #d4d4d8  (darkest — page canvas)
Card        #e4e4e7  (lighter — raised surface)
Input       #d4d4d8  (same as base — recessed via border)
```

In dark mode, elevation goes lighter too, but starting from near-black:
```
Background  #09090b  → Card  #18181b  → Input  #27272a
```

---

## Fixed accent colors (unchanged in both modes)

| Element | Value | Notes |
|---------|-------|-------|
| Primary button `bg-violet-600` | `#7c3aed` | Same in both modes |
| Approve / success `bg-green-600` | `#16a34a` | Same |
| Active state tint `bg-violet-500/[0.08]` | — | Works on both base colors |
| Focus ring `ring-violet-500/30` | — | Works on both |

---

## Status badge colors (light mode)

Used in `ESTADO_BADGE` record in `playlists/[id]/page.tsx`:

| Estado | Light bg | Light text | Dark bg | Dark text |
|--------|----------|------------|---------|-----------|
| PREPARACION | `#bbf7d0` (green-200) | `#15803d` (green-700) | `violet-500/10` | `violet-400` |
| ENSAYO | `#fef3c7` (amber-100) | `#92400e` (amber-800) | `yellow-400/10` | `yellow-400` |
| DEFINITIVA | `#dbeafe` (blue-100) | `#1e40af` (blue-800) | `blue-400/10` | `blue-400` |
| MAZO | `bg-input text-mid` (auto) | — | same | — |

Stepper current estado (active badge): `bg-[#bbf7d0] text-[#15803d]` light / `bg-violet-600 text-white` dark.

---

## Bottom navigation (light mode)

In light mode the nav is a **standard anchored tab bar**, not a floating pill:

```
position: fixed bottom-0
width: 100% (full viewport width)
background: rgba(212,212,216,0.97)
border-top: 1.5px solid #a1a1aa
border-radius: 0 (no pill rounding)
```

Active tab:
- Icon color: `#7c3aed` (violet-600) — NO background bubble
- Label color: `#7c3aed`

Inactive tab:
- Icon color: `#a1a1aa`
- Label color: `#a1a1aa`

Dark mode keeps the floating pill with violet bubble.

---

## Card shadows

Cards in light mode use: `box-shadow: 0 2px 10px rgba(0,0,0,0.08)` (`shadow-card` Tailwind token).
Dark mode: no shadow (`dark:shadow-none`).

---

## Anti-patterns for light mode

- ❌ Pure white `#ffffff` backgrounds — use `bg-base` / `bg-card`
- ❌ Floating pill bottom nav in light — use anchored tab bar
- ❌ `shadow-black/60` — too heavy; max `shadow-black/10` in dark (light uses `shadow-card`)
- ❌ `text-violet-300` or `text-white` as primary text — unreadable on light gray
- ❌ Gradients on page background or cards
