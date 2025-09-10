class SmartReminder {
    constructor() {
        this.tasks = [];
        this.goals = [];
        this.reminders = [];
        this.activeReminder = null;
        this.currentTab = 'tasks';
        this.notificationPermission = 'default';

        this.initializeApp();
        this.setupEventListeners();
        this.loadData();
        this.startReminderChecker();
    }

    initializeApp() {
        // set sensible defaults for date/time inputs
        const today = new Date().toISOString().split('T')[0];
        const taskDate = document.getElementById('task-date');
        const goalDate = document.getElementById('goal-date');
        const taskTime = document.getElementById('task-time');

        if (taskDate) taskDate.value = today;
        if (goalDate) goalDate.value = today;

        const now = new Date();
        now.setHours(now.getHours() + 1);
        if (taskTime) taskTime.value = now.toTimeString().substring(0,5);

        // check notification permission and hide banner if granted
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            if (this.notificationPermission === 'granted') this.hideNotificationBanner();
        }

        // allow audio to be played after first user interaction in some browsers
        // (attempt to unlock audio). This won't cause sound to play immediately.
        const audio = document.getElementById('notification-sound');
        const unlockAudio = () => {
            if (audio) {
                audio.play().then(()=>{ audio.pause(); audio.currentTime = 0; }).catch(()=>{});
            }
            document.removeEventListener('click', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
    }

    setupEventListeners() {
        // Tab switching: use the button element itself so clicking inner icons/text also works
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                if (tab) this.switchTab(tab);
            });
        });

        // Forms
        const taskForm = document.getElementById('task-form');
        if (taskForm) taskForm.addEventListener('submit', (e) => { e.preventDefault(); this.addTask(); });

        const goalForm = document.getElementById('goal-form');
        if (goalForm) goalForm.addEventListener('submit', (e) => { e.preventDefault(); this.addGoal(); });

        // Notification permission button
        const enableBtn = document.getElementById('enable-notifications');
        if (enableBtn) enableBtn.addEventListener('click', () => this.requestNotificationPermission());

        // Modal controls
        const modalClose = document.getElementById('modal-close');
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());

        const reminderLater = document.getElementById('reminder-later');
        if (reminderLater) reminderLater.addEventListener('click', () => this.closeModal());

        const reminderDone = document.getElementById('reminder-done');
        if (reminderDone) reminderDone.addEventListener('click', () => this.completeReminder());
    }

    switchTab(tabName) {
        if (!tabName) return;
        this.currentTab = tabName;

        // update active tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // update tab content
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        const content = document.getElementById(`${tabName}-tab`);
        if (content) content.classList.add('active');

        // update form title and visibility
        const formTitle = document.getElementById('form-title');
        if (formTitle) formTitle.textContent = tabName === 'tasks' ? 'Tugas' : 'Tujuan';
        const taskForm = document.getElementById('task-form');
        const goalForm = document.getElementById('goal-form');
        if (taskForm) taskForm.classList.toggle('active', tabName === 'tasks');
        if (goalForm) goalForm.classList.toggle('active', tabName === 'goals');

        this.refreshDisplay();
    }

    // --- Task / Reminder / Goal management ---
    addTask() {
        const titleInput = document.getElementById('task-title');
        const descInput = document.getElementById('task-description');
        const dateInput = document.getElementById('task-date');
        const timeInput = document.getElementById('task-time');
        const priorityInput = document.getElementById('task-priority');
        const categoryInput = document.getElementById('task-category');
        const optimalInput = document.getElementById('task-optimal');

        if (!titleInput || !dateInput || !timeInput) return;
        const title = titleInput.value.trim();
        if (!title) return;

        // build a full ISO datetime for reminder (local time)
        const dueDate = dateInput.value; // YYYY-MM-DD
        const time = timeInput.value; // HH:MM
        const reminderDate = new Date(`${dueDate}T${time}:00`);

        const task = {
            id: Date.now().toString(),
            title,
            description: descInput ? descInput.value.trim() : '',
            dueDate,
            priority: priorityInput ? priorityInput.value : 'medium',
            completed: false,
            category: categoryInput ? categoryInput.value : 'general',
            optimalTime: optimalInput ? optimalInput.value || undefined : undefined,
            reminderTime: reminderDate.toISOString(),
            notified: false
        };

        this.tasks.push(task);

        const reminder = {
            id: Date.now().toString() + '-r',
            taskId: task.id,
            time: task.reminderTime,
            message: `Pengingat untuk: ${task.title}`,
            interacted: false,
            notificationShown: false,
            response: undefined
        };

        this.reminders.push(reminder);

        // reset form
        const taskForm = document.getElementById('task-form');
        if (taskForm) taskForm.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        this.saveData();
        this.refreshDisplay();
    }

    addGoal() {
        const titleInput = document.getElementById('goal-title');
        const dateInput = document.getElementById('goal-date');
        const targetInput = document.getElementById('goal-target');
        const unitInput = document.getElementById('goal-unit');

        if (!titleInput || !dateInput) return;
        const title = titleInput.value.trim();
        if (!title) return;

        const goal = {
            id: Date.now().toString(),
            title,
            targetDate: dateInput.value,
            progress: 0,
            target: parseInt(targetInput ? targetInput.value : '1') || 1,
            unit: unitInput ? unitInput.value.trim() : 'tugas',
            tasks: []
        };

        this.goals.push(goal);

        const goalForm = document.getElementById('goal-form');
        if (goalForm) goalForm.reset();
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        if (targetInput) targetInput.value = '1';
        if (unitInput) unitInput.value = 'tugas';

        this.saveData();
        this.refreshDisplay();
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        task.completed = !task.completed;

        if (task.completed) {
            this.reminders.forEach(r => { if (r.taskId === taskId) r.interacted = true; });
        }

        this.saveData();
        this.refreshDisplay();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.reminders = this.reminders.filter(r => r.taskId !== taskId);

        this.goals.forEach(goal => {
            goal.tasks = goal.tasks.filter(id => id !== taskId);
        });

        this.saveData();
        this.refreshDisplay();
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.saveData();
        this.refreshDisplay();
    }

    updateGoalProgress(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        if (goal.progress < goal.target) {
            goal.progress += 1;
            this.saveData();
            this.refreshDisplay();
        }
    }

    showReminderModal(reminder) {
        this.activeReminder = reminder;
        const task = this.tasks.find(t => t.id === reminder.taskId);
        if (!task) return;

        const titleEl = document.getElementById('reminder-task-title');
        if (titleEl) titleEl.textContent = task.title;

        const modal = document.getElementById('reminder-modal');
        if (modal) modal.classList.add('active');
    }

    completeReminder() {
        if (!this.activeReminder) return;
        const respEl = document.getElementById('reminder-response');
        const response = respEl ? respEl.value.trim() : '';

        this.activeReminder.interacted = true;
        this.activeReminder.response = response;

        const task = this.tasks.find(t => t.id === this.activeReminder.taskId);
        if (task) task.completed = true;

        this.saveData();
        this.closeModal();
        this.refreshDisplay();
    }

    closeModal() {
        const modal = document.getElementById('reminder-modal');
        if (modal) modal.classList.remove('active');
        const respEl = document.getElementById('reminder-response');
        if (respEl) respEl.value = '';
        this.activeReminder = null;
    }

    requestNotificationPermission() {
        if (!('Notification' in window)) return;
        Notification.requestPermission().then(permission => {
            this.notificationPermission = permission;
            if (permission === 'granted') this.hideNotificationBanner();
        });
    }

    hideNotificationBanner() {
        const banner = document.getElementById('notification-banner');
        if (banner) banner.style.display = 'none';
    }

    // --- Reminder checking (no buffer) ---
    checkReminders() {
        const now = new Date();

        this.reminders.forEach(reminder => {
            if (reminder.interacted || reminder.notificationShown) return;

            const task = this.tasks.find(t => t.id === reminder.taskId);
            if (!task) return;

            // convert stored ISO reminder time to Date
            const reminderTime = new Date(reminder.time);

            // trigger as soon as now >= reminderTime (no extra buffer)
            if (now >= reminderTime) {
                // mark and show
                this.showNotification(reminder, task);
                reminder.notificationShown = true;
                task.notified = true;
                this.saveData();
                this.refreshDisplay();
            }
        });
    }

    showNotification(reminder, task) {
        // play audio (may be blocked if user hasn't interacted with page yet)
        const audio = document.getElementById('notification-sound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {
                // autoplay might be blocked; nothing to do
            });
        }

        // desktop/browser notification
        if (this.notificationPermission === 'granted') {
            try {
                const n = new Notification('Smart Reminder', {
                    body: `Pengingat: ${task.title}
${reminder.message}`,
                    icon: '/icon-192.png',
                    tag: `reminder-${reminder.id}`,
                    requireInteraction: true
                });

                n.onclick = () => {
                    window.focus();
                    this.showReminderModal(reminder);
                    n.close();
                };

                // auto close after some time
                setTimeout(() => n.close(), 30000);
            } catch (err) {
                // ignore if Notification constructor fails
                console.warn('Notification failed:', err);
            }
        }

        // always show in-app modal as well
        this.showReminderModal(reminder);
    }

    startReminderChecker() {
        // check every second to achieve near-instant notification at the scheduled time
        this._checkerInterval = setInterval(() => this.checkReminders(), 1000);
        this.checkReminders();
    }

    // --- Rendering + helpers (expanded) ---
    refreshDisplay() {
        this.renderTasks();
        this.renderGoals();
        this.renderReminders();
        this.updateBadges();

        // redraw lucide icons for any newly inserted elements
        if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const completedList = document.getElementById('completed-tasks-list');
        if (!tasksList || !completedList) return;

        tasksList.innerHTML = '';
        completedList.innerHTML = '';

        const pendingTasks = this.tasks.filter(t => !t.completed);
        const completedTasks = this.tasks.filter(t => t.completed);

        const tasksCountEl = document.getElementById('tasks-count');
        if (tasksCountEl) tasksCountEl.textContent = `${pendingTasks.length} tugas belum selesai`;

        const completedSection = document.getElementById('completed-tasks');
        if (completedSection) completedSection.style.display = completedTasks.length > 0 ? 'block' : 'none';

        pendingTasks.forEach(task => tasksList.appendChild(this.createTaskElement(task)));
        completedTasks.forEach(task => completedList.appendChild(this.createCompletedTaskElement(task)));
    }

    renderGoals() {
        const goalsList = document.getElementById('goals-list');
        if (!goalsList) return;
        goalsList.innerHTML = '';
        this.goals.forEach(goal => goalsList.appendChild(this.createGoalElement(goal)));
    }

    renderReminders() {
        const remindersList = document.getElementById('reminders-list');
        const historyList = document.getElementById('history-list');
        if (!remindersList || !historyList) return;

        remindersList.innerHTML = '';
        historyList.innerHTML = '';

        // active reminders: show ones not interacted with yet (regardless of notificationShown)
        const activeReminders = this.reminders.filter(r => !r.interacted);
        const historyReminders = this.reminders.filter(r => r.interacted);

        const historySection = document.getElementById('reminders-history');
        if (historySection) historySection.style.display = historyReminders.length > 0 ? 'block' : 'none';

        activeReminders.forEach(r => {
            const task = this.tasks.find(t => t.id === r.taskId);
            if (task) remindersList.appendChild(this.createReminderElement(r, task));
        });

        historyReminders.forEach(r => {
            const task = this.tasks.find(t => t.id === r.taskId);
            if (task) historyList.appendChild(this.createHistoryElement(r, task));
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item priority-${task.priority} ${task.notified ? 'notified' : ''}`;

        const priorityIcon = this.getPriorityIcon(task.priority);
        const priorityText = this.getPriorityText(task.priority);

        const reminderTime = task.reminderTime ? new Date(task.reminderTime) : null;
        const timeLabel = reminderTime ? reminderTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-';

        div.innerHTML = `
            <div class="task-header">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-priority">
                    ${priorityIcon}
                    <span>${priorityText}</span>
                    ${task.notified ? '<i data-lucide="bell" class="pulse"></i>' : ''}
                </div>
            </div>
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <div class="task-meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${this.formatDate(task.dueDate)}</span>
                </div>
                <div class="task-meta-item">
                    <i data-lucide="bell"></i>
                    <span>${timeLabel}</span>
                </div>
                ${task.optimalTime ? `
                <div class="task-meta-item">
                    <i data-lucide="clock"></i>
                    <span>Optimal: ${this.escapeHtml(task.optimalTime)}</span>
                </div>
                ` : ''}
                <div class="task-meta-item">
                    <span>${this.escapeHtml(task.category || '')}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-outline complete-btn" data-id="${task.id}">
                    <i data-lucide="check-square"></i>
                    Tandai Selesai
                </button>
                <button class="btn-outline delete-btn" data-id="${task.id}">
                    <i data-lucide="trash-2"></i>
                    Hapus
                </button>
            </div>
        `;

        // attach listeners (use querySelector after adding element)
        div.querySelector('.complete-btn').addEventListener('click', () => this.toggleTaskCompletion(task.id));
        div.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

        return div;
    }

    createGoalElement(goal) {
        const div = document.createElement('div');
        div.className = 'goal-item';

        const progressPercentage = (goal.progress / goal.target) * 100;

        div.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">${this.escapeHtml(goal.title)}</div>
                <div class="goal-actions">
                    <button class="btn-outline delete-goal-btn" data-id="${goal.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="goal-description">
                Target: ${goal.target} ${this.escapeHtml(goal.unit)} • Selesai: ${this.formatDate(goal.targetDate)}
            </div>
            <div class="progress-container">
                <div class="progress-info">
                    <span>Progress: ${goal.progress}/${goal.target} ${this.escapeHtml(goal.unit)}</span>
                    <span>${Math.round(progressPercentage)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-status">
                    <i data-lucide="trending-up"></i>
                    <span>${progressPercentage >= 100 ? 'Target tercapai!' : 'Sedang berprogress...'}</span>
                </div>
            </div>
            <button class="btn-outline progress-btn" data-id="${goal.id}" ${goal.progress >= goal.target ? 'disabled' : ''}>
                <i data-lucide="plus"></i>
                Tambah Progress
            </button>
        `;

        div.querySelector('.progress-btn').addEventListener('click', () => this.updateGoalProgress(goal.id));
        div.querySelector('.delete-goal-btn').addEventListener('click', () => this.deleteGoal(goal.id));

        return div;
    }

    createReminderElement(reminder, task) {
        const div = document.createElement('div');
        div.className = 'task-item priority-high';

        const reminderTime = reminder.time ? new Date(reminder.time) : null;
        const timeLabel = reminderTime ? reminderTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-';

        div.innerHTML = `
            <div class="task-header">
                <div class="task-title">Pengingat Tugas</div>
                <div class="task-priority">
                    <i data-lucide="bell" class="pulse"></i>
                </div>
            </div>
            <div class="task-description">${this.escapeHtml(reminder.message)}</div>
            <div class="task-meta">
                <div class="task-meta-item">
                    <i data-lucide="clock"></i>
                    <span>${timeLabel}</span>
                </div>
                <div class="task-meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${this.formatDate(task.dueDate)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-primary respond-btn" data-id="${reminder.id}">Tandai sebagai Dikerjakan</button>
            </div>
        `;

        div.querySelector('.respond-btn').addEventListener('click', () => this.showReminderModal(reminder));

        return div;
    }

    createCompletedTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'completed-task';

        div.innerHTML = `
            <div class="completed-task-text">
                <i data-lucide="check-circle"></i>
                <span>${this.escapeHtml(task.title)}</span>
            </div>
            <button class="btn-outline delete-btn" data-id="${task.id}">
                <i data-lucide="trash-2"></i>
            </button>
        `;

        div.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));
        return div;
    }

    createHistoryElement(reminder, task) {
        const div = document.createElement('div');
        div.className = 'completed-task';

        div.innerHTML = `
            <div>
                <div class="completed-task-text">
                    <i data-lucide="check-circle"></i>
                    <span>${this.escapeHtml(task.title)}</span>
                </div>
                <p class="text-sm text-gray-600">Ditandai selesai pada ${new Date(reminder.time).toLocaleString()}</p>
                ${reminder.response ? `
                <p class="text-sm text-gray-700 mt-2"><strong>Catatan:</strong> ${this.escapeHtml(reminder.response)}</p>` : ''}
            </div>
        `;

        return div;
    }

    // small helpers
    getPriorityIcon(priority) {
        const mapping = {
            high: '<i data-lucide="flag"></i>',
            medium: '<i data-lucide="flag"></i>',
            low: '<i data-lucide="flag"></i>'
        };
        return mapping[priority] || mapping.medium;
    }

    getPriorityText(priority) {
        return priority === 'high' ? 'Tinggi' : (priority === 'medium' ? 'Sedang' : 'Rendah');
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    updateBadges() {
        const unreadReminders = this.reminders.filter(r => !r.interacted && r.notificationShown).length;
        const notifiedTasks = this.tasks.filter(t => !t.completed && t.notified).length;

        const unreadEl = document.getElementById('unread-badge');
        const remindersBadge = document.getElementById('reminders-badge');
        const tasksBadge = document.getElementById('tasks-badge');

        if (unreadEl) unreadEl.textContent = unreadReminders;
        if (remindersBadge) remindersBadge.textContent = this.reminders.filter(r => !r.interacted).length;
        if (tasksBadge) tasksBadge.textContent = this.tasks.filter(t => !t.completed && t.notified).length;

        document.title = unreadReminders > 0 ? `(${unreadReminders}) Smart Reminder` : 'Smart Reminder';
    }

    saveData() {
        try {
            const data = { tasks: this.tasks, goals: this.goals, reminders: this.reminders };
            localStorage.setItem('smart-reminder-data', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save data', e);
        }
    }

    loadData() {
        try {
            const raw = localStorage.getItem('smart-reminder-data');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            this.tasks = parsed.tasks || [];
            this.goals = parsed.goals || [];
            this.reminders = parsed.reminders || [];
            this.refreshDisplay();
        } catch (e) {
            console.warn('Failed to load data', e);
        }
    }

    // small utility to avoid XSS in inserted strings
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// initialize app when DOM ready
window.addEventListener('DOMContentLoaded', () => {
    window.smartReminderApp = new SmartReminder();
    // ensure lucide icons are created once at startup
    if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
});
