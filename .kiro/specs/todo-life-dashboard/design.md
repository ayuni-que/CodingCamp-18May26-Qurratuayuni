# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page personal productivity application built entirely with HTML, CSS, and Vanilla JavaScript. It runs without a build step, backend, or network dependency — opening directly from the filesystem (`file://`) or as a browser extension new-tab page.

The application is composed of four self-contained widgets rendered inside a single `index.html` file:

- **Greeting Widget** — live clock, date, and time-of-day greeting
- **Focus Timer** — Pomodoro-style 25-minute countdown with Start / Stop / Reset
- **To-Do List** — persistent task manager with add, edit, complete, and delete
- **Quick Links** — user-defined shortcut buttons that open URLs in a new tab

All user data (tasks and links) is persisted exclusively in `localStorage`. No server calls are ever made. The entire application ships as three files: `index.html`, `css/style.css`, and `js/app.js`.

---

## Architecture

### High-Level Structure

```
todo-life-dashboard/
├── index.html          ← single entry point; all widget markup lives here
├── css/
│   └── style.css       ← all styles: layout, theming, responsive rules
└── js/
    └── app.js          ← all JavaScript: state, rendering, event handling
```

The architecture follows a **module-per-widget** pattern inside a single `app.js` file. Each widget is represented by a plain JavaScript object (namespace) that owns its state, its DOM-rendering functions, and its event handlers. A thin `init()` bootstrap function at the bottom of the file wires everything together on `DOMContentLoaded`.

### Data Flow

```
localStorage  ──read──▶  app.js (state objects)  ──render──▶  DOM
     ▲                          │
     └──────write───────────────┘  (on every mutation)
```

State is always the source of truth. The DOM is a pure projection of state. Every mutation (add task, delete link, etc.) updates the in-memory state object, persists it to `localStorage`, then re-renders the affected widget's list.

### Execution Model

```
DOMContentLoaded
  │
  ├── Greeting.init()      → starts setInterval (1 s tick)
  ├── Timer.init()         → sets initial display, binds button events
  ├── TodoList.init()      → loads from localStorage, renders tasks
  └── QuickLinks.init()    → loads from localStorage, renders links
```

No global mutable variables are used outside the widget namespaces. Each widget namespace is a `const` object literal defined at module scope.

---

## Components and Interfaces

### 1. Greeting Widget (`Greeting`)

**Responsibility**: Display the live time, full date, and a time-of-day greeting. Update every second via `setInterval`.

**Public interface**:

```js
Greeting.init()          // starts the 1-second tick and renders immediately
Greeting.render()        // reads Date(), updates #greeting-time, #greeting-date, #greeting-message
Greeting.getTimeOfDay()  // returns 'morning' | 'afternoon' | 'evening' based on current hour
```

**DOM targets**:
- `#greeting-time` — `<span>` showing `HH:MM:SS`
- `#greeting-date` — `<span>` showing `"Wednesday, June 18, 2025"`
- `#greeting-message` — `<h1>` showing `"Good Morning"` / `"Good Afternoon"` / `"Good Evening"`

**Time-of-day boundaries**:
- Morning: hours 0–11 (inclusive)
- Afternoon: hours 12–17 (inclusive)
- Evening: hours 18–23 (inclusive)

---

### 2. Focus Timer (`Timer`)

**Responsibility**: Manage a 25-minute countdown with Start, Stop, and Reset controls. Enforce the state machine described in the Data Models section.

**Public interface**:

```js
Timer.init()             // sets display to 25:00, binds button events
Timer.start()            // transitions idle/paused → running; starts setInterval
Timer.stop()             // transitions running → paused; clears interval
Timer.reset()            // transitions any state → idle; restores 25:00
Timer.tick()             // called every second; decrements remaining, checks for 00:00
Timer.render()           // updates #timer-display with MM:SS
Timer.updateControls()   // enables/disables Start/Stop/Reset buttons per current state
Timer.notify()           // called when countdown reaches 00:00; shows completion message
```

**DOM targets**:
- `#timer-display` — `<span>` showing `MM:SS`
- `#timer-start` — Start button
- `#timer-stop` — Stop button
- `#timer-reset` — Reset button
- `#timer-message` — `<p>` for session-complete notification

---

### 3. To-Do List (`TodoList`)

**Responsibility**: Manage an ordered list of task objects. Support add, toggle-complete, edit, and delete. Persist to `localStorage` after every mutation.

**Public interface**:

```js
TodoList.init()                    // loads state from localStorage, renders
TodoList.addTask(text)             // validates, creates task object, saves, renders
TodoList.deleteTask(id)            // removes task by id, saves, renders
TodoList.toggleTask(id)            // flips task.done, saves, renders
TodoList.beginEdit(id)             // switches task row to edit mode
TodoList.confirmEdit(id, newText)  // validates, updates task.text, saves, renders
TodoList.cancelEdit(id)            // exits edit mode without saving
TodoList.render()                  // rebuilds #todo-list from state.tasks
TodoList.save()                    // serialises state.tasks to localStorage
TodoList.load()                    // deserialises from localStorage; returns [] on error
```

**DOM targets**:
- `#todo-input` — text input for new task
- `#todo-submit` — add button
- `#todo-list` — `<ul>` container; children are `<li>` elements built by `render()`

**Task row structure** (built dynamically):

```html
<li data-id="{id}" class="task-item [done]">
  <button class="task-complete">✓</button>
  <span class="task-text">{text}</span>
  <button class="task-edit">✎</button>
  <button class="task-delete">✕</button>
</li>
```

In edit mode the `<span class="task-text">` is replaced with `<input class="task-edit-input">` and the edit/delete buttons become confirm/cancel.

---

### 4. Quick Links (`QuickLinks`)

**Responsibility**: Display saved links as clickable buttons. Support add and remove. Persist to `localStorage` after every mutation.

**Public interface**:

```js
QuickLinks.init()                  // loads state from localStorage, renders
QuickLinks.addLink(label, url)     // validates, creates link object, saves, renders
QuickLinks.removeLink(id)          // removes link by id, saves, renders
QuickLinks.render()                // rebuilds #links-list from state.links
QuickLinks.save()                  // serialises state.links to localStorage
QuickLinks.load()                  // deserialises from localStorage; returns [] on error
```

**DOM targets**:
- `#link-label-input` — text input for link label
- `#link-url-input` — text input for link URL
- `#link-submit` — add button
- `#links-list` — `<div>` container; children are link-button wrappers built by `render()`

**Link item structure** (built dynamically):

```html
<div class="link-item" data-id="{id}">
  <a href="{url}" target="_blank" rel="noopener noreferrer" class="link-btn">{label}</a>
  <button class="link-remove">✕</button>
</div>
```

---

## Data Models

### localStorage Keys

| Key | Widget | Value type |
|-----|--------|------------|
| `tld_tasks` | Todo List | JSON array of Task objects |
| `tld_links` | Quick Links | JSON array of Link objects |

The `tld_` prefix namespaces the keys to avoid collisions with other apps sharing the same origin.

---

### Task Object

```js
{
  id:   string,   // crypto.randomUUID() or Date.now().toString() fallback
  text: string,   // non-empty, trimmed task description
  done: boolean   // false = pending, true = completed
}
```

**Example**:
```json
[
  { "id": "1718700000000", "text": "Write design doc", "done": false },
  { "id": "1718700001000", "text": "Review requirements", "done": true }
]
```

---

### Link Object

```js
{
  id:    string,  // crypto.randomUUID() or Date.now().toString() fallback
  label: string,  // non-empty display label for the button
  url:   string   // non-empty URL string (user-supplied, not validated for format)
}
```

**Example**:
```json
[
  { "id": "1718700002000", "label": "GitHub", "url": "https://github.com" },
  { "id": "1718700003000", "label": "MDN", "url": "https://developer.mozilla.org" }
]
```

---

### Timer State Machine

The Focus Timer has four states. Transitions are driven by user button clicks and the internal tick.

```
         ┌─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     │
      ┌──────┐  start()   ┌─────────┐  tick→0:00  ┌───────────┴──┐
      │ IDLE │──────────▶ │ RUNNING │────────────▶ │  COMPLETED   │
      └──────┘            └─────────┘              └──────────────┘
         ▲                    │  stop()                   │
         │                    ▼                           │ reset()
         │               ┌────────┐                       │
         └───────────────│ PAUSED │◀──────────────────────┘
              reset()    └────────┘
                              │
                              └──── start() ──▶ RUNNING
```

**State → allowed controls**:

| State | Start | Stop | Reset |
|-------|-------|------|-------|
| IDLE | ✅ enabled | ❌ disabled | ❌ disabled |
| RUNNING | ❌ disabled | ✅ enabled | ✅ enabled |
| PAUSED | ✅ enabled | ❌ disabled | ✅ enabled |
| COMPLETED | ❌ disabled | ❌ disabled | ✅ enabled |

**Timer state object** (in-memory only, not persisted):

```js
Timer.state = {
  status:    'idle',   // 'idle' | 'running' | 'paused' | 'completed'
  remaining: 1500,     // seconds remaining (1500 = 25:00)
  intervalId: null     // setInterval handle, or null when not running
}
```

---

## CSS Architecture

### File: `css/style.css`

The stylesheet is organised into five logical sections, each delimited by a comment block:

```
/* === 1. CSS Custom Properties (Design Tokens) === */
/* === 2. Reset & Base Styles === */
/* === 3. Layout === */
/* === 4. Widget Styles === */
/* === 5. Responsive Overrides === */
```

### Design Tokens (CSS Custom Properties)

All colours, spacing, and typography values are defined as custom properties on `:root` so the entire theme can be changed in one place:

```css
:root {
  --color-bg:        #1a1a2e;
  --color-surface:   #16213e;
  --color-accent:    #0f3460;
  --color-highlight: #e94560;
  --color-text:      #eaeaea;
  --color-muted:     #888;

  --font-family:     'Segoe UI', system-ui, sans-serif;
  --font-size-base:  16px;   /* minimum 14px per Req 7.3 */
  --font-size-sm:    14px;
  --font-size-lg:    1.5rem;
  --font-size-xl:    3rem;

  --radius:          8px;
  --gap:             1rem;
  --transition:      150ms ease;
}
```

### Layout

The dashboard uses CSS Grid for the top-level widget arrangement:

```css
.dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: var(--gap);
  padding: var(--gap);
  min-height: 100vh;
}
```

Widget placement:

```
┌─────────────────┬─────────────────┐
│  Greeting       │  Focus Timer    │
├─────────────────┼─────────────────┤
│  To-Do List     │  Quick Links    │
└─────────────────┴─────────────────┘
```

Each widget is a `.widget` card with `background: var(--color-surface)`, `border-radius: var(--radius)`, and `padding: var(--gap)`.

### Responsive Design

At `max-width: 768px` the grid collapses to a single column:

```css
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}
```

At `max-width: 480px` font sizes and padding are reduced to keep the layout usable at 320px viewport width.

### Interactive Feedback

All interactive elements (buttons, inputs, links) have explicit `:hover`, `:focus`, and `:active` states using `transition: var(--transition)` to meet the 100ms feedback requirement (Req 7.4). Focus styles use `outline` rather than removing it, ensuring keyboard accessibility.

---

## HTML Structure

### `index.html` Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main class="dashboard">

    <!-- Widget 1: Greeting -->
    <section class="widget" id="widget-greeting">
      <h1 id="greeting-message">Good Morning</h1>
      <p id="greeting-time"></p>
      <p id="greeting-date"></p>
    </section>

    <!-- Widget 2: Focus Timer -->
    <section class="widget" id="widget-timer">
      <h2>Focus Timer</h2>
      <div id="timer-display">25:00</div>
      <div class="timer-controls">
        <button id="timer-start">Start</button>
        <button id="timer-stop" disabled>Stop</button>
        <button id="timer-reset" disabled>Reset</button>
      </div>
      <p id="timer-message" aria-live="polite"></p>
    </section>

    <!-- Widget 3: To-Do List -->
    <section class="widget" id="widget-todo">
      <h2>To-Do List</h2>
      <div class="todo-input-row">
        <input type="text" id="todo-input" placeholder="Add a task…" aria-label="New task">
        <button id="todo-submit">Add</button>
      </div>
      <ul id="todo-list" aria-label="Task list"></ul>
    </section>

    <!-- Widget 4: Quick Links -->
    <section class="widget" id="widget-links">
      <h2>Quick Links</h2>
      <div id="links-list" aria-label="Saved links"></div>
      <div class="link-input-row">
        <input type="text" id="link-label-input" placeholder="Label" aria-label="Link label">
        <input type="text" id="link-url-input" placeholder="https://…" aria-label="Link URL">
        <button id="link-submit">Add</button>
      </div>
      <p id="link-error" role="alert" aria-live="assertive"></p>
    </section>

  </main>
  <script src="js/app.js"></script>
</body>
</html>
```

---

## Event Handling Approach

All event listeners are registered once during `init()` using **event delegation** on container elements where lists are involved. This avoids re-binding listeners every time the list re-renders.

### Delegation Pattern

```js
// TodoList: one listener on the <ul>, not on each <li>
document.getElementById('todo-list').addEventListener('click', (e) => {
  const li = e.target.closest('[data-id]');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('.task-complete')) TodoList.toggleTask(id);
  if (e.target.matches('.task-edit'))    TodoList.beginEdit(id);
  if (e.target.matches('.task-delete'))  TodoList.deleteTask(id);
  if (e.target.matches('.task-confirm')) TodoList.confirmEdit(id, li.querySelector('.task-edit-input').value);
  if (e.target.matches('.task-cancel'))  TodoList.cancelEdit(id);
});
```

The same pattern applies to `#links-list` for the Quick Links widget.

### Direct Listeners

Controls that are always present in the DOM (timer buttons, add-task button, add-link button) use direct `addEventListener` calls registered once in `init()`.

### Keyboard Support

- `#todo-input` fires `addTask` on `Enter` keydown.
- `#link-label-input` and `#link-url-input` fire `addLink` on `Enter` keydown.
- Edit-mode inputs fire `confirmEdit` on `Enter` and `cancelEdit` on `Escape`.

---

## Error Handling

### localStorage Read Failures

Both `TodoList.load()` and `QuickLinks.load()` wrap `JSON.parse` in a `try/catch`. On any error (missing key, malformed JSON, `localStorage` unavailable), they return an empty array `[]` and the widget initialises cleanly. No error is surfaced to the user.

```js
load() {
  try {
    return JSON.parse(localStorage.getItem('tld_tasks')) || [];
  } catch {
    return [];
  }
}
```

### Input Validation

- **Task add/edit**: `text.trim().length === 0` → reject; retain focus on input.
- **Link add**: `label.trim().length === 0 || url.trim().length === 0` → reject; display which field is missing in `#link-error`.
- No URL format validation is performed (per requirements: user-supplied URLs are stored as-is).

### Timer Edge Cases

- Calling `start()` while already `running` is a no-op (Start button is disabled in that state).
- `tick()` guards against going below 0: `remaining = Math.max(0, remaining - 1)`.
- `reset()` always calls `clearInterval` before resetting state, even if `intervalId` is `null` (safe no-op).

### Cross-Browser `crypto.randomUUID`

```js
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
```

This ensures ID generation works in older browsers and `file://` contexts where `crypto.randomUUID` may be unavailable.


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature is well-suited for property-based testing. The core logic — time-of-day classification, timer formatting, task/link CRUD, and localStorage serialization — consists of pure functions whose correctness must hold across a wide range of inputs. A property-based testing library (e.g., [fast-check](https://github.com/dubzzz/fast-check) for JavaScript) should be used to generate inputs automatically.

---

### Property 1: Time-of-day classification is exhaustive and correct

*For any* integer hour value in the range [0, 23], `Greeting.getTimeOfDay(hour)` shall return `'morning'` for hours 0–11, `'afternoon'` for hours 12–17, and `'evening'` for hours 18–23. Every valid hour maps to exactly one period, and no hour is unclassified.

**Validates: Requirements 1.3, 1.4, 1.5**

---

### Property 2: Time rendering is a faithful projection of a Date value

*For any* `Date` object, `Greeting.render(date)` shall produce a time string whose hours, minutes, and seconds exactly match `date.getHours()`, `date.getMinutes()`, and `date.getSeconds()` (zero-padded to two digits), and a date string that contains the correct weekday name, month name, day-of-month, and full year from that same `Date` object.

**Validates: Requirements 1.1, 1.2**

---

### Property 3: Timer tick decrements remaining and renders correct MM:SS

*For any* timer in `'running'` state with `remaining` seconds R (where R > 0), calling `Timer.tick()` N times (N ≤ R) shall result in `Timer.state.remaining === R - N`, and `Timer.render()` shall display the string `MM:SS` where `MM = Math.floor((R-N)/60)` zero-padded and `SS = (R-N) % 60` zero-padded.

**Validates: Requirements 2.2, 2.3**

---

### Property 4: Reset always restores the timer to its initial state

*For any* timer state (`'idle'`, `'running'`, `'paused'`, or `'completed'`) and any `remaining` value, calling `Timer.reset()` shall always produce `Timer.state.remaining === 1500`, `Timer.state.status === 'idle'`, and `Timer.state.intervalId === null`.

**Validates: Requirements 2.5**

---

### Property 5: Button control states are a pure function of timer state

*For any* timer state value, `Timer.updateControls()` shall produce the following deterministic button configuration: Start enabled iff state is `'idle'` or `'paused'`; Stop enabled iff state is `'running'`; Reset enabled iff state is `'running'`, `'paused'`, or `'completed'`. No other combination is valid.

**Validates: Requirements 2.7, 2.8**

---

### Property 6: Adding a valid task grows the list and preserves all prior tasks

*For any* existing tasks array and any non-empty, non-whitespace-only string `text`, calling `TodoList.addTask(text)` shall increase `tasks.length` by exactly 1, the new task shall have `text` equal to `text.trim()` and `done === false`, and all previously existing tasks shall remain in the array with their original `id`, `text`, and `done` values unchanged.

**Validates: Requirements 3.2**

---

### Property 7: Whitespace-only task descriptions are always rejected

*For any* string composed entirely of whitespace characters (including the empty string), calling `TodoList.addTask(text)` shall leave `tasks.length` unchanged and shall not add any new task to the array.

**Validates: Requirements 3.3**

---

### Property 8: Task completion toggle is its own inverse (round-trip)

*For any* task in the list, calling `TodoList.toggleTask(id)` twice in succession shall produce a `done` value identical to the task's `done` value before either call was made. A single call shall produce `done === !originalDone`.

**Validates: Requirements 3.4**

---

### Property 9: Deleting a task removes exactly that task and no others

*For any* tasks array of length N and any valid task `id` in that array, calling `TodoList.deleteTask(id)` shall result in an array of length N-1 that contains no task with that `id`, and all other tasks shall remain present with their original values unchanged.

**Validates: Requirements 3.5**

---

### Property 10: Editing a task with valid text updates only that task's text

*For any* non-empty, non-whitespace-only string `newText` and any valid task `id`, calling `TodoList.confirmEdit(id, newText)` shall update that task's `text` to `newText.trim()` and leave all other task fields (`id`, `done`) and all other tasks in the array unchanged.

**Validates: Requirements 3.7**

---

### Property 11: Editing a task with whitespace-only text is always rejected

*For any* string composed entirely of whitespace characters and any valid task `id`, calling `TodoList.confirmEdit(id, text)` shall leave the task's `text` value unchanged.

**Validates: Requirements 3.8**

---

### Property 12: Task list serialization is a round-trip

*For any* valid tasks array (including empty array, single task, and multiple tasks with mixed `done` states), calling `TodoList.save()` followed by `TodoList.load()` shall produce an array that is deeply equal to the original — same length, same order, same `id`/`text`/`done` values for every element.

**Validates: Requirements 3.9, 3.10**

---

### Property 13: Quick Links render count and href correctness

*For any* links array of length N, calling `QuickLinks.render()` shall produce exactly N link items in `#links-list`, and for each link object, the rendered anchor element shall have `href` equal to `link.url`, `target` equal to `'_blank'`, and visible text equal to `link.label`.

**Validates: Requirements 4.1, 4.2**

---

### Property 14: Adding a valid link grows the list

*For any* existing links array and any non-empty, non-whitespace-only `label` and `url` strings, calling `QuickLinks.addLink(label, url)` shall increase `links.length` by exactly 1, and the new link shall have `label` equal to `label.trim()` and `url` equal to `url.trim()`.

**Validates: Requirements 4.4**

---

### Property 15: Links with empty label or URL are always rejected

*For any* `(label, url)` pair where at least one of `label.trim()` or `url.trim()` is the empty string, calling `QuickLinks.addLink(label, url)` shall leave `links.length` unchanged and shall not add any new link to the array.

**Validates: Requirements 4.5**

---

### Property 16: Removing a link removes exactly that link and no others

*For any* links array of length N and any valid link `id` in that array, calling `QuickLinks.removeLink(id)` shall result in an array of length N-1 that contains no link with that `id`, and all other links shall remain present with their original values unchanged.

**Validates: Requirements 4.6**

---

### Property 17: Link list serialization is a round-trip

*For any* valid links array (including empty array and multiple links), calling `QuickLinks.save()` followed by `QuickLinks.load()` shall produce an array that is deeply equal to the original — same length, same order, same `id`/`label`/`url` values for every element.

**Validates: Requirements 4.7, 4.8**

---

### Property 18: Malformed or absent localStorage always yields an empty array

*For any* value stored in `localStorage` under `tld_tasks` or `tld_links` that is not valid JSON (including `null`, `undefined`, arbitrary strings, truncated JSON, and non-array JSON values), calling `TodoList.load()` or `QuickLinks.load()` respectively shall return `[]` without throwing any exception.

**Validates: Requirements 5.3, 5.4**

---

## Testing Strategy

### Applicability of Property-Based Testing

This feature is a strong candidate for property-based testing. The core logic consists of pure functions (time classification, MM:SS formatting, task/link CRUD operations, JSON serialization) whose correctness must hold across a wide input space. A property-based testing library eliminates the need to manually enumerate edge cases.

**Recommended library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, no build step required when loaded via CDN or bundled).

### Dual Testing Approach

**Property-based tests** (using fast-check) cover Properties 1–18 above. Each test runs a minimum of 100 iterations with randomly generated inputs. Each test is tagged with a comment in the format:

```
// Feature: todo-life-dashboard, Property N: <property_text>
```

**Unit tests** (example-based) cover:
- Timer initialization (Req 2.1): verify `remaining === 1500` and display shows `"25:00"` after `init()`
- Timer stop preserves remaining (Req 2.4): start, tick 3 times, stop, verify remaining is unchanged
- Timer completion notification (Req 2.6): set remaining to 1, call tick(), verify status is `'completed'` and notify was called
- Task edit mode activation (Req 3.6): call `beginEdit(id)`, verify the task row renders an input element
- localStorage key correctness (Req 5.1, 5.2): after save(), verify `localStorage.getItem('tld_tasks')` and `localStorage.getItem('tld_links')` are non-null

**Integration / smoke checks** (manual or single-execution):
- Cross-browser rendering (Req 6.1): manual verification in Chrome, Firefox, Edge, Safari
- File structure (Req 6.2): verify exactly `index.html`, `css/style.css`, `js/app.js` exist
- `file://` protocol (Req 6.3): open `index.html` directly from filesystem and verify all widgets function
- Browser extension context (Req 6.4): load as new-tab extension and verify functionality
- Initial render performance (Req 7.1): verify no network requests are made; render is synchronous
- Font size (Req 7.3): verify `--font-size-sm` is `14px` in CSS
- Transition timing (Req 7.4): verify `--transition` is `≤ 150ms` in CSS

### Property Test Configuration

- Minimum **100 iterations** per property test
- Use `fc.integer({ min: 0, max: 23 })` for hour generation (Property 1)
- Use `fc.date()` for Date object generation (Property 2)
- Use `fc.integer({ min: 1, max: 1500 })` for remaining seconds (Property 3)
- Use `fc.constantFrom('idle', 'running', 'paused', 'completed')` for timer state (Properties 4, 5)
- Use `fc.string().filter(s => s.trim().length > 0)` for valid task/link text (Properties 6, 10, 14)
- Use `fc.string().map(s => s.replace(/\S/g, ' '))` or `fc.constant('')` for whitespace-only inputs (Properties 7, 11, 15)
- Use `fc.array(taskArbitrary)` for task arrays (Properties 8, 9, 12)
- Use `fc.array(linkArbitrary)` for link arrays (Properties 13, 16, 17)
- Use `fc.oneof(fc.constant(null), fc.string().filter(s => { try { JSON.parse(s); return false; } catch { return true; } }))` for malformed storage values (Property 18)
