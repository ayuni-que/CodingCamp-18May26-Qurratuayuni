/* To-Do List Life Dashboard — js/app.js */

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const Greeting = {
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 17) return 'afternoon';
    return 'evening';
  },

  render() {
    const now = new Date();

    // Format HH:MM:SS (zero-padded)
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('greeting-time').textContent = `${hh}:${mm}:${ss}`;

    // Format full date string e.g. "Wednesday, June 18, 2025"
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    document.getElementById('greeting-date').textContent = dateStr;

    // Set greeting message based on time of day
    const period = Greeting.getTimeOfDay();
    const messages = {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
    };
    document.getElementById('greeting-message').textContent = messages[period];
  },

  init() {
    Greeting.render();
    setInterval(Greeting.render, 1000);
  },
};

const Timer = {
  state: {
    status: 'idle',
    remaining: 1500,
    intervalId: null,
  },

  render() {
    const mm = String(Math.floor(Timer.state.remaining / 60)).padStart(2, '0');
    const ss = String(Timer.state.remaining % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mm}:${ss}`;
  },

  updateControls() {
    const { status } = Timer.state;
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    startBtn.disabled = !(status === 'idle' || status === 'paused');
    stopBtn.disabled  = !(status === 'running');
    resetBtn.disabled = !(status === 'running' || status === 'paused' || status === 'completed');
  },

  tick() {
    Timer.state.remaining = Math.max(0, Timer.state.remaining - 1);
    Timer.render();
    if (Timer.state.remaining === 0) {
      clearInterval(Timer.state.intervalId);
      Timer.state.intervalId = null;
      Timer.state.status = 'completed';
      Timer.notify();
    }
  },

  notify() {
    document.getElementById('timer-message').textContent = 'Session complete! Take a break.';
    Timer.updateControls();
  },

  start() {
    const { status } = Timer.state;
    if (status !== 'idle' && status !== 'paused') return;
    Timer.state.intervalId = setInterval(Timer.tick, 1000);
    Timer.state.status = 'running';
    Timer.updateControls();
  },

  stop() {
    clearInterval(Timer.state.intervalId);
    Timer.state.intervalId = null;
    Timer.state.status = 'paused';
    Timer.updateControls();
  },

  reset() {
    clearInterval(Timer.state.intervalId);
    Timer.state.intervalId = null;
    Timer.state.remaining = 1500;
    Timer.state.status = 'idle';
    document.getElementById('timer-message').textContent = '';
    Timer.render();
    Timer.updateControls();
  },

  init() {
    Timer.render();
    Timer.updateControls();
    document.getElementById('timer-start').addEventListener('click', Timer.start);
    document.getElementById('timer-stop').addEventListener('click', Timer.stop);
    document.getElementById('timer-reset').addEventListener('click', Timer.reset);
  },
};

const TodoList = {
  state: {
    tasks: [],
  },

  load() {
    try {
      return JSON.parse(localStorage.getItem('tld_tasks')) || [];
    } catch {
      return [];
    }
  },

  save() {
    localStorage.setItem('tld_tasks', JSON.stringify(TodoList.state.tasks));
  },

  render() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    TodoList.state.tasks.forEach((task) => {
      const li = document.createElement('li');
      li.dataset.id = task.id;
      li.className = 'task-item' + (task.done ? ' done' : '');

      const completeBtn = document.createElement('button');
      completeBtn.className = 'task-complete';
      completeBtn.textContent = '✓';
      completeBtn.setAttribute('aria-label', task.done ? 'Mark incomplete' : 'Mark complete');

      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;

      const editBtn = document.createElement('button');
      editBtn.className = 'task-edit';
      editBtn.textContent = '✎';
      editBtn.setAttribute('aria-label', 'Edit task');

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete';
      deleteBtn.textContent = '✕';
      deleteBtn.setAttribute('aria-label', 'Delete task');

      li.appendChild(completeBtn);
      li.appendChild(textSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  },

  addTask(text) {
    if (text.trim().length === 0) {
      document.getElementById('todo-input').focus();
      return;
    }
    TodoList.state.tasks.push({
      id: generateId(),
      text: text.trim(),
      done: false,
    });
    TodoList.save();
    TodoList.render();
    document.getElementById('todo-input').value = '';
  },

  deleteTask(id) {
    TodoList.state.tasks = TodoList.state.tasks.filter((t) => t.id !== id);
    TodoList.save();
    TodoList.render();
  },

  toggleTask(id) {
    const task = TodoList.state.tasks.find((t) => t.id === id);
    if (task) {
      task.done = !task.done;
      TodoList.save();
      TodoList.render();
    }
  },

  beginEdit(id) {
    const li = document.querySelector(`#todo-list [data-id="${id}"]`);
    if (!li) return;

    const textSpan = li.querySelector('.task-text');
    const editBtn = li.querySelector('.task-edit');
    const deleteBtn = li.querySelector('.task-delete');

    // Replace span with input
    const input = document.createElement('input');
    input.className = 'task-edit-input';
    input.value = textSpan.textContent;
    li.replaceChild(input, textSpan);

    // Replace edit + delete buttons with confirm + cancel
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'task-confirm';
    confirmBtn.textContent = '✔';
    confirmBtn.setAttribute('aria-label', 'Confirm edit');

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'task-cancel';
    cancelBtn.textContent = '✖';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    li.replaceChild(confirmBtn, editBtn);
    li.replaceChild(cancelBtn, deleteBtn);

    input.focus();
  },

  confirmEdit(id, newText) {
    if (newText.trim().length === 0) return;
    const task = TodoList.state.tasks.find((t) => t.id === id);
    if (task) {
      task.text = newText.trim();
      TodoList.save();
      TodoList.render();
    }
  },

  cancelEdit(id) {
    TodoList.render();
  },

  init() {
    TodoList.state.tasks = TodoList.load();
    TodoList.render();

    // Add task via button click
    document.getElementById('todo-submit').addEventListener('click', () => {
      TodoList.addTask(document.getElementById('todo-input').value);
    });

    // Add task via Enter key on input
    document.getElementById('todo-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        TodoList.addTask(document.getElementById('todo-input').value);
      }
    });

    // Delegated click handler on the list
    document.getElementById('todo-list').addEventListener('click', (e) => {
      const li = e.target.closest('[data-id]');
      if (!li) return;
      const id = li.dataset.id;

      if (e.target.matches('.task-complete')) {
        TodoList.toggleTask(id);
      } else if (e.target.matches('.task-edit')) {
        TodoList.beginEdit(id);
      } else if (e.target.matches('.task-delete')) {
        TodoList.deleteTask(id);
      } else if (e.target.matches('.task-confirm')) {
        const input = li.querySelector('.task-edit-input');
        TodoList.confirmEdit(id, input ? input.value : '');
      } else if (e.target.matches('.task-cancel')) {
        TodoList.cancelEdit(id);
      }
    });

    // Delegated keydown handler for edit-mode inputs
    document.getElementById('todo-list').addEventListener('keydown', (e) => {
      if (!e.target.matches('.task-edit-input')) return;
      const li = e.target.closest('[data-id]');
      if (!li) return;
      const id = li.dataset.id;

      if (e.key === 'Enter') {
        TodoList.confirmEdit(id, e.target.value);
      } else if (e.key === 'Escape') {
        TodoList.cancelEdit(id);
      }
    });
  },
};

const QuickLinks = {
  state: {
    links: [],
  },

  load() {
    try {
      return JSON.parse(localStorage.getItem('tld_links')) || [];
    } catch {
      return [];
    }
  },

  save() {
    localStorage.setItem('tld_links', JSON.stringify(QuickLinks.state.links));
  },

  render() {
    const container = document.getElementById('links-list');
    container.innerHTML = '';

    QuickLinks.state.links.forEach((link) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'link-item';
      wrapper.dataset.id = link.id;

      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'link-btn';
      anchor.textContent = link.label;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'link-remove';
      removeBtn.setAttribute('aria-label', `Remove ${link.label}`);
      removeBtn.textContent = '✕';

      wrapper.appendChild(anchor);
      wrapper.appendChild(removeBtn);
      container.appendChild(wrapper);
    });
  },

  addLink(label, url) {
    const errorEl = document.getElementById('link-error');

    if (label.trim().length === 0 && url.trim().length === 0) {
      errorEl.textContent = 'Label and URL are required.';
      return;
    }
    if (label.trim().length === 0) {
      errorEl.textContent = 'Label is required.';
      return;
    }
    if (url.trim().length === 0) {
      errorEl.textContent = 'URL is required.';
      return;
    }

    errorEl.textContent = '';
    QuickLinks.state.links.push({
      id: generateId(),
      label: label.trim(),
      url: url.trim(),
    });
    QuickLinks.save();
    QuickLinks.render();
    document.getElementById('link-label-input').value = '';
    document.getElementById('link-url-input').value = '';
  },

  removeLink(id) {
    QuickLinks.state.links = QuickLinks.state.links.filter((l) => l.id !== id);
    QuickLinks.save();
    QuickLinks.render();
  },

  init() {
    QuickLinks.state.links = QuickLinks.load();
    QuickLinks.render();

    // Add link via button click
    document.getElementById('link-submit').addEventListener('click', () => {
      QuickLinks.addLink(
        document.getElementById('link-label-input').value,
        document.getElementById('link-url-input').value
      );
    });

    // Add link via Enter key on either input
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        QuickLinks.addLink(
          document.getElementById('link-label-input').value,
          document.getElementById('link-url-input').value
        );
      }
    };
    document.getElementById('link-label-input').addEventListener('keydown', handleEnter);
    document.getElementById('link-url-input').addEventListener('keydown', handleEnter);

    // Delegated click handler on the links container
    document.getElementById('links-list').addEventListener('click', (e) => {
      const wrapper = e.target.closest('[data-id]');
      if (!wrapper) return;
      const id = wrapper.dataset.id;

      if (e.target.matches('.link-remove')) {
        QuickLinks.removeLink(id);
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Greeting.init();
  Timer.init();
  TodoList.init();
  QuickLinks.init();
});
