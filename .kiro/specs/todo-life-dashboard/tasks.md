# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a single-page personal productivity dashboard using only `index.html`, `css/style.css`, and `js/app.js`. No build tools, no npm, no test files. All tasks are completed by directly editing these three files. Widgets are implemented incrementally — scaffold first, then each widget in isolation, then cross-widget polish.

---

## Tasks

- [ ] 1. Scaffold the three project files with base structure
  - Create `index.html` with the full HTML skeleton: `<!DOCTYPE html>`, `<head>` with charset, viewport, title, and `<link rel="stylesheet" href="css/style.css">`, and `<body>` containing `<main class="dashboard">` with four `<section class="widget">` placeholders (IDs: `widget-greeting`, `widget-timer`, `widget-todo`, `widget-links`), and `<script src="js/app.js">` before `</body>`
  - Create `css/style.css` as an empty file with a single comment block header: `/* To-Do List Life Dashboard — css/style.css */`
  - Create `js/app.js` as an empty file with a single comment block header: `/* To-Do List Life Dashboard — js/app.js */` and a `document.addEventListener('DOMContentLoaded', () => {});` stub
  - _Requirements: 6.2, 6.3_

- [x] 2. Implement CSS design tokens, reset, and dashboard layout
  - [x] 2.1 Add CSS custom properties and base reset to `css/style.css`
    - Write the `/* === 1. CSS Custom Properties (Design Tokens) === */` section on `:root` with all variables: `--color-bg: #1a1a2e`, `--color-surface: #16213e`, `--color-accent: #0f3460`, `--color-highlight: #e94560`, `--color-text: #eaeaea`, `--color-muted: #888`, `--font-family: 'Segoe UI', system-ui, sans-serif`, `--font-size-base: 16px`, `--font-size-sm: 14px`, `--font-size-lg: 1.5rem`, `--font-size-xl: 3rem`, `--radius: 8px`, `--gap: 1rem`, `--transition: 150ms ease`
    - Write the `/* === 2. Reset & Base Styles === */` section: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`, `body` with `background`, `color`, `font-family`, `font-size` from tokens, minimum `font-size: var(--font-size-sm)` on all text elements
    - _Requirements: 7.2, 7.3_
  - [x] 2.2 Add dashboard grid layout and widget card styles to `css/style.css`
    - Write the `/* === 3. Layout === */` section: `.dashboard` as a 2-column CSS Grid (`grid-template-columns: 1fr 1fr`, `gap: var(--gap)`, `padding: var(--gap)`, `min-height: 100vh`)
    - Write the `/* === 4. Widget Styles === */` section: `.widget` card with `background: var(--color-surface)`, `border-radius: var(--radius)`, `padding: var(--gap)`
    - Write the `/* === 5. Responsive Overrides === */` section: `@media (max-width: 768px)` collapses grid to `1fr`; `@media (max-width: 480px)` reduces font sizes and padding for 320px usability
    - _Requirements: 7.2, 7.5_

- [x] 3. Implement the Greeting Widget
  - [x] 3.1 Add Greeting widget HTML markup to `index.html`
    - Inside `#widget-greeting`, add: `<h1 id="greeting-message">Good Morning</h1>`, `<p id="greeting-time"></p>`, `<p id="greeting-date"></p>`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 3.2 Implement `Greeting` namespace in `js/app.js`
    - Define `const Greeting = { ... }` with `getTimeOfDay()` returning `'morning'` for hours 0–11, `'afternoon'` for 12–17, `'evening'` for 18–23
    - Implement `render()`: reads `new Date()`, formats `HH:MM:SS` (zero-padded) into `#greeting-time`, formats full date string (`"Wednesday, June 18, 2025"`) into `#greeting-date`, sets `#greeting-message` text to `"Good Morning"` / `"Good Afternoon"` / `"Good Evening"` based on `getTimeOfDay()`
    - Implement `init()`: calls `render()` immediately, then starts `setInterval(Greeting.render, 1000)`
    - Wire `Greeting.init()` inside the `DOMContentLoaded` callback
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 3.3 Add Greeting widget styles to `css/style.css`
    - Style `#greeting-message` with `font-size: var(--font-size-xl)` and `color: var(--color-highlight)`
    - Style `#greeting-time` with `font-size: var(--font-size-lg)` and monospace font
    - Style `#greeting-date` with `font-size: var(--font-size-sm)` and `color: var(--color-muted)`
    - _Requirements: 7.2, 7.3_

- [x] 4. Implement the Focus Timer Widget
  - [x] 4.1 Add Focus Timer HTML markup to `index.html`
    - Inside `#widget-timer`, add: `<h2>Focus Timer</h2>`, `<div id="timer-display">25:00</div>`, `<div class="timer-controls">` containing `<button id="timer-start">Start</button>`, `<button id="timer-stop" disabled>Stop</button>`, `<button id="timer-reset" disabled>Reset</button>`, and `<p id="timer-message" aria-live="polite"></p>`
    - _Requirements: 2.1, 2.7, 2.8_
  - [x] 4.2 Implement `Timer` namespace in `js/app.js`
    - Define `const Timer = { state: { status: 'idle', remaining: 1500, intervalId: null }, ... }`
    - Implement `render()`: formats `state.remaining` as `MM:SS` (zero-padded) and writes to `#timer-display`
    - Implement `updateControls()`: enables/disables `#timer-start`, `#timer-stop`, `#timer-reset` per the state machine table (Start enabled in `idle`/`paused`; Stop enabled in `running`; Reset enabled in `running`/`paused`/`completed`)
    - Implement `tick()`: decrements `state.remaining` by 1 (floor at 0 via `Math.max`), calls `render()`, and if `remaining === 0` calls `notify()` and transitions to `completed`
    - Implement `notify()`: sets `#timer-message` text to `"Session complete! Take a break."` and calls `updateControls()`
    - Implement `start()`: guards against non-`idle`/`paused` state; starts `setInterval(Timer.tick, 1000)`, sets `status` to `'running'`, calls `updateControls()`
    - Implement `stop()`: clears interval, sets `status` to `'paused'`, calls `updateControls()`
    - Implement `reset()`: clears interval (safe even if null), sets `remaining` to 1500, `status` to `'idle'`, `intervalId` to null, clears `#timer-message`, calls `render()` and `updateControls()`
    - Implement `init()`: calls `render()` and `updateControls()`, binds click listeners on `#timer-start` → `Timer.start()`, `#timer-stop` → `Timer.stop()`, `#timer-reset` → `Timer.reset()`
    - Wire `Timer.init()` inside the `DOMContentLoaded` callback
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  - [x] 4.3 Add Focus Timer styles to `css/style.css`
    - Style `#timer-display` with `font-size: var(--font-size-xl)`, monospace font, centered text
    - Style `.timer-controls` with `display: flex`, `gap: var(--gap)`, `justify-content: center`
    - Style timer buttons with `background: var(--color-accent)`, `color: var(--color-text)`, `border-radius: var(--radius)`, `:hover` and `:focus` states using `var(--color-highlight)` and `transition: var(--transition)`; style `[disabled]` buttons with `opacity: 0.4` and `cursor: not-allowed`
    - Style `#timer-message` with `color: var(--color-highlight)`, `font-size: var(--font-size-sm)`, centered
    - _Requirements: 7.4_

- [ ] 5. Checkpoint — verify Greeting and Timer work end-to-end
  - Open `index.html` in a browser via `file://` and confirm: clock ticks every second, greeting changes with time of day, timer counts down from 25:00, Stop/Reset enable/disable correctly, session-complete message appears at 00:00.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the To-Do List Widget
  - [x] 6.1 Add To-Do List HTML markup to `index.html`
    - Inside `#widget-todo`, add: `<h2>To-Do List</h2>`, `<div class="todo-input-row">` containing `<input type="text" id="todo-input" placeholder="Add a task…" aria-label="New task">` and `<button id="todo-submit">Add</button>`, and `<ul id="todo-list" aria-label="Task list"></ul>`
    - _Requirements: 3.1_
  - [x] 6.2 Implement `generateId` helper and `TodoList` namespace in `js/app.js`
    - Define `function generateId()` that returns `crypto.randomUUID()` when available, falling back to `Date.now().toString(36) + Math.random().toString(36).slice(2)`
    - Define `const TodoList = { state: { tasks: [] }, ... }`
    - Implement `load()`: wraps `JSON.parse(localStorage.getItem('tld_tasks'))` in `try/catch`, returns `[]` on any error or null result
    - Implement `save()`: calls `localStorage.setItem('tld_tasks', JSON.stringify(state.tasks))`
    - Implement `render()`: clears `#todo-list`, then for each task in `state.tasks` creates an `<li data-id="{id}" class="task-item [done]">` containing a complete button (`class="task-complete"`), a `<span class="task-text">`, an edit button (`class="task-edit"`), and a delete button (`class="task-delete"`); appends each `<li>` to `#todo-list`
    - Implement `addTask(text)`: if `text.trim().length === 0` refocus `#todo-input` and return; otherwise push `{ id: generateId(), text: text.trim(), done: false }` to `state.tasks`, call `save()`, `render()`, and clear `#todo-input`
    - Implement `deleteTask(id)`: filters `state.tasks` to remove the matching id, calls `save()` and `render()`
    - Implement `toggleTask(id)`: finds the task by id, flips `task.done`, calls `save()` and `render()`
    - Implement `beginEdit(id)`: finds the `<li data-id="{id}">`, replaces `<span class="task-text">` with `<input class="task-edit-input" value="{text}">`, swaps edit/delete buttons for confirm (`class="task-confirm"`) and cancel (`class="task-cancel"`) buttons
    - Implement `confirmEdit(id, newText)`: if `newText.trim().length === 0` return without saving; otherwise update `task.text` to `newText.trim()`, call `save()` and `render()`
    - Implement `cancelEdit(id)`: calls `render()` to restore the normal row without saving
    - Implement `init()`: sets `state.tasks = load()`, calls `render()`, binds `#todo-submit` click → `addTask(#todo-input.value)`, binds `#todo-input` keydown `Enter` → same, binds delegated click on `#todo-list` using `e.target.closest('[data-id]')` to dispatch to `toggleTask`, `beginEdit`, `deleteTask`, `confirmEdit`, `cancelEdit`; binds `keydown` on `#todo-list` to fire `confirmEdit` on `Enter` and `cancelEdit` on `Escape` for edit-mode inputs
    - Wire `TodoList.init()` inside the `DOMContentLoaded` callback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 5.1, 5.3_
  - [x] 6.3 Add To-Do List styles to `css/style.css`
    - Style `.todo-input-row` with `display: flex`, `gap: 0.5rem`; style `#todo-input` to `flex: 1`
    - Style `#todo-list` with `list-style: none`, `margin-top: var(--gap)`
    - Style `.task-item` with `display: flex`, `align-items: center`, `gap: 0.5rem`, `padding: 0.5rem 0`, `border-bottom: 1px solid var(--color-accent)`
    - Style `.task-item.done .task-text` with `text-decoration: line-through` and `color: var(--color-muted)`
    - Style `.task-complete`, `.task-edit`, `.task-delete`, `.task-confirm`, `.task-cancel` as icon-style buttons with `background: transparent`, `border: none`, `cursor: pointer`, `color: var(--color-text)`, `:hover` color change using `var(--color-highlight)` and `transition: var(--transition)`
    - Style `.task-text` with `flex: 1`
    - Style `.task-edit-input` with `flex: 1`, `background: var(--color-accent)`, `color: var(--color-text)`, `border: 1px solid var(--color-highlight)`, `border-radius: var(--radius)`, `padding: 0.25rem 0.5rem`
    - _Requirements: 3.4, 7.4_

- [x] 7. Implement the Quick Links Widget
  - [x] 7.1 Add Quick Links HTML markup to `index.html`
    - Inside `#widget-links`, add: `<h2>Quick Links</h2>`, `<div id="links-list" aria-label="Saved links"></div>`, `<div class="link-input-row">` containing `<input type="text" id="link-label-input" placeholder="Label" aria-label="Link label">`, `<input type="text" id="link-url-input" placeholder="https://…" aria-label="Link URL">`, and `<button id="link-submit">Add</button>`, and `<p id="link-error" role="alert" aria-live="assertive"></p>`
    - _Requirements: 4.3_
  - [x] 7.2 Implement `QuickLinks` namespace in `js/app.js`
    - Define `const QuickLinks = { state: { links: [] }, ... }`
    - Implement `load()`: wraps `JSON.parse(localStorage.getItem('tld_links'))` in `try/catch`, returns `[]` on any error or null result
    - Implement `save()`: calls `localStorage.setItem('tld_links', JSON.stringify(state.links))`
    - Implement `render()`: clears `#links-list`, then for each link creates `<div class="link-item" data-id="{id}">` containing `<a href="{url}" target="_blank" rel="noopener noreferrer" class="link-btn">{label}</a>` and `<button class="link-remove" aria-label="Remove {label}">✕</button>`; appends each wrapper to `#links-list`
    - Implement `addLink(label, url)`: if `label.trim().length === 0` or `url.trim().length === 0`, set `#link-error` text to indicate which field is missing and return; otherwise clear `#link-error`, push `{ id: generateId(), label: label.trim(), url: url.trim() }` to `state.links`, call `save()`, `render()`, and clear both inputs
    - Implement `removeLink(id)`: filters `state.links` to remove the matching id, calls `save()` and `render()`
    - Implement `init()`: sets `state.links = load()`, calls `render()`, binds `#link-submit` click → `addLink(#link-label-input.value, #link-url-input.value)`, binds `Enter` keydown on both inputs → same, binds delegated click on `#links-list` using `e.target.closest('[data-id]')` to dispatch `removeLink` when `.link-remove` is clicked
    - Wire `QuickLinks.init()` inside the `DOMContentLoaded` callback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.2, 5.4_
  - [x] 7.3 Add Quick Links styles to `css/style.css`
    - Style `#links-list` with `display: flex`, `flex-wrap: wrap`, `gap: 0.5rem`, `margin-bottom: var(--gap)`
    - Style `.link-item` with `display: flex`, `align-items: center`, `gap: 0.25rem`
    - Style `.link-btn` as a pill button: `background: var(--color-accent)`, `color: var(--color-text)`, `border-radius: var(--radius)`, `padding: 0.4rem 0.8rem`, `text-decoration: none`, `:hover` and `:focus` states with `background: var(--color-highlight)` and `transition: var(--transition)`
    - Style `.link-remove` as a small icon button: `background: transparent`, `border: none`, `cursor: pointer`, `color: var(--color-muted)`, `:hover` color `var(--color-highlight)`, `transition: var(--transition)`
    - Style `.link-input-row` with `display: flex`, `gap: 0.5rem`, `flex-wrap: wrap`; inputs with `flex: 1`, `min-width: 80px`
    - Style `#link-error` with `color: var(--color-highlight)`, `font-size: var(--font-size-sm)`, `min-height: 1.2em`
    - _Requirements: 4.1, 4.5, 7.4_

- [ ] 8. Checkpoint — verify To-Do List and Quick Links work end-to-end
  - Open `index.html` in a browser via `file://` and confirm: tasks add/edit/complete/delete correctly, tasks survive page refresh, links add/open/remove correctly, links survive page refresh, empty-submission validation shows correct feedback.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Cross-widget polish — keyboard support, accessibility, and responsive tweaks
  - [x] 9.1 Audit and complete keyboard support across all widgets in `js/app.js` and `index.html`
    - Verify `#todo-input` fires `addTask` on `Enter` keydown (already wired in task 6.2; confirm no gaps)
    - Verify edit-mode `<input class="task-edit-input">` fires `confirmEdit` on `Enter` and `cancelEdit` on `Escape` via the delegated keydown listener on `#todo-list`
    - Verify `#link-label-input` and `#link-url-input` fire `addLink` on `Enter` keydown
    - Ensure all buttons are reachable and activatable via `Tab` + `Enter`/`Space` (no `tabindex="-1"` on interactive elements unless intentional)
    - _Requirements: 7.4_
  - [x] 9.2 Add and verify ARIA attributes and focus styles in `index.html` and `css/style.css`
    - Confirm `aria-live="polite"` on `#timer-message` and `aria-live="assertive"` on `#link-error` are present in `index.html`
    - Confirm `aria-label` attributes are present on `#todo-input`, `#todo-list`, `#link-label-input`, `#link-url-input`, `#links-list`
    - Add `aria-label="Remove {label}"` to each `.link-remove` button (already in `QuickLinks.render()`; confirm it is set dynamically)
    - In `css/style.css`, ensure all interactive elements have a visible `:focus` style — use `outline: 2px solid var(--color-highlight)` and `outline-offset: 2px` rather than `outline: none`
    - _Requirements: 7.4_
  - [-] 9.3 Final responsive and visual polish in `css/style.css`
    - Review `@media (max-width: 480px)` block: reduce `--font-size-xl` to `2rem` for the greeting and timer display, reduce widget padding to `0.75rem`, ensure `.link-input-row` inputs stack vertically if needed
    - Verify the dashboard is usable at 320px viewport width by checking that no widget overflows horizontally
    - Add `overflow-wrap: break-word` to `.task-text` and `.link-btn` to prevent long text from breaking layout
    - _Requirements: 7.5_

- [ ] 10. Final checkpoint — full cross-browser and file-protocol verification
  - Open `index.html` via `file://` in Chrome, Firefox, Edge, and Safari and confirm all four widgets render and function correctly with no console errors.
  - Confirm the file structure is exactly `index.html`, `css/style.css`, `js/app.js` — no other files required.
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- All work is done by editing exactly three files: `index.html`, `css/style.css`, `js/app.js`
- No build tools, no npm, no package.json, no test files of any kind
- Tasks build incrementally — each task assumes the previous tasks are complete
- Checkpoints (tasks 5, 8, 10) are manual browser verification steps, not automated tests
- The `generateId` helper is shared by both `TodoList` and `QuickLinks` and should be defined once near the top of `app.js`
- All widget namespaces (`Greeting`, `Timer`, `TodoList`, `QuickLinks`) are `const` object literals wired together in a single `DOMContentLoaded` callback at the bottom of `app.js`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2"] },
    { "id": 2, "tasks": ["3.1", "4.1", "6.1", "7.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "6.2", "7.2"] },
    { "id": 4, "tasks": ["3.3", "4.3", "6.3", "7.3"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3"] }
  ]
}
```
