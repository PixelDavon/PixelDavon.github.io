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
        // Set current date as default for date inputs
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task-date').value = today;
        document.getElementById('goal-date').value = today;
        
        // Set current time + 1 hour as default for time inputs
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const timeString = now.toTimeString().substring(0, 5);
        document.getElementById('task-time').value = timeString;
        
        // Check notification permission
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            if (this.notificationPermission === 'granted') {
                this.hideNotificationBanner();
            }
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        document.getElementById('goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });

        // Notification permission
        document.getElementById('enable-notifications').addEventListener('click', () => {
            this.requestNotificationPermission();
        });

        // Modal actions
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('reminder-later').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('reminder-done').addEventListener('click', () => {
            this.completeReminder();
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Update form title and visibility
        document.getElementById('form-title').textContent = tabName === 'tasks' ? 'Tugas' : 'Tujuan';
        document.getElementById('task-form').classList.toggle('active', tabName === 'tasks');
        document.getElementById('goal-form').classList.toggle('active', tabName === 'goals');
        
        // Refresh displayed data
        this.refreshDisplay();
    }

    addTask() {
        const title = document.getElementById('task-title').value.trim();
        if (!title) return;

        const task = {
            id: Date.now().toString(),
            title: title,
            description: document.getElementById('task-description').value.trim(),
            dueDate: document.getElementById('task-date').value,
            priority: document.getElementById('task-priority').value,
            completed: false,
            category: document.getElementById('task-category').value,
            optimalTime: document.getElementById('task-optimal').value || undefined,
            reminderTime: document.getElementById('task-time').value,
            notified: false
        };

        this.tasks.push(task);
        
        // Create reminder
        const reminder = {
            id: Date.now().toString(),
            taskId: task.id,
            time: task.reminderTime,
            message: `Pengingat untuk: ${task.title}`,
            interacted: false,
            notificationShown: false
        };

        this.reminders.push(reminder);
        
        // Reset form
        document.getElementById('task-form').reset();
        document.getElementById('task-date').value = new Date().toISOString().split('T')[0];
        
        // Update display and save
        this.refreshDisplay();
        this.saveData();
    }

    addGoal() {
        const title = document.getElementById('goal-title').value.trim();
        if (!title) return;

        const goal = {
            id: Date.now().toString(),
            title: title,
            targetDate: document.getElementById('goal-date').value,
            progress: 0,
            target: parseInt(document.getElementById('goal-target').value),
            unit: document.getElementById('goal-unit').value.trim(),
            tasks: []
        };

        this.goals.push(goal);
        
        // Reset form
        document.getElementById('goal-form').reset();
        document.getElementById('goal-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('goal-target').value = '1';
        document.getElementById('goal-unit').value = 'tugas';
        
        // Update display and save
        this.refreshDisplay();
        this.saveData();
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        
        // Mark reminder as interacted if task is completed
        if (task.completed) {
            this.reminders.forEach(reminder => {
                if (reminder.taskId === taskId) {
                    reminder.interacted = true;
                }
            });
        }

        this.refreshDisplay();
        this.saveData();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.reminders = this.reminders.filter(reminder => reminder.taskId !== taskId);
        
        // Remove task from goals
        this.goals.forEach(goal => {
            goal.tasks = goal.tasks.filter(id => id !== taskId);
        });

        this.refreshDisplay();
        this.saveData();
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(goal => goal.id !== goalId);
        this.refreshDisplay();
        this.saveData();
    }

    updateGoalProgress(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        if (goal.progress < goal.target) {
            goal.progress++;
            this.refreshDisplay();
            this.saveData();
        }
    }

    showReminderModal(reminder) {
        this.activeReminder = reminder;
        const task = this.tasks.find(t => t.id === reminder.taskId);
        
        if (task) {
            document.getElementById('reminder-task-title').textContent = task.title;
            document.getElementById('reminder-modal').classList.add('active');
        }
    }

    completeReminder() {
        if (!this.activeReminder) return;

        const response = document.getElementById('reminder-response').value.trim();
        this.activeReminder.interacted = true;
        this.activeReminder.response = response;
        
        // Also mark task as completed
        const task = this.tasks.find(t => t.id === this.activeReminder.taskId);
        if (task) {
            task.completed = true;
        }

        this.closeModal();
        this.refreshDisplay();
        this.saveData();
    }

    closeModal() {
        document.getElementById('reminder-modal').classList.remove('active');
        document.getElementById('reminder-response').value = '';
        this.activeReminder = null;
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                this.notificationPermission = permission;
                if (permission === 'granted') {
                    this.hideNotificationBanner();
                    new Notification('Notifikasi Diaktifkan', {
                        body: 'Anda akan menerima pengingat untuk tugas yang jatuh tempo.',
                        icon: '/icon-192.png'
                    });
                }
            });
        }
    }

    hideNotificationBanner() {
        document.getElementById('notification-banner').style.display = 'none';
    }

    checkReminders() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDate = now.toISOString().split('T')[0];
        
        this.reminders.forEach(reminder => {
            const task = this.tasks.find(t => t.id === reminder.taskId);
            if (task && !reminder.interacted && !reminder.notificationShown && 
                task.dueDate === currentDate && reminder.time === currentTime) {
                
                this.showNotification(reminder, task);
                reminder.notificationShown = true;
                task.notified = true;
                this.saveData();
                this.refreshDisplay();
            }
        });
    }

    showNotification(reminder, task) {
        // Play sound
        const audio = document.getElementById('notification-sound');
        audio.currentTime = 0;
        audio.play().catch(() => {});

        // Show browser notification
        if (this.notificationPermission === 'granted') {
            const notification = new Notification('Smart Reminder', {
                body: `Pengingat: ${task.title}\n${reminder.message}`,
                icon: '/icon-192.png',
                tag: `reminder-${reminder.id}`,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                this.showReminderModal(reminder);
                notification.close();
            };

            setTimeout(() => notification.close(), 30000);
        }

        // Show in-app modal if app is open
        this.showReminderModal(reminder);
    }

    startReminderChecker() {
        setInterval(() => this.checkReminders(), 30000); // Check every 30 seconds
        this.checkReminders(); // Check immediately
    }

    refreshDisplay() {
        this.renderTasks();
        this.renderGoals();
        this.renderReminders();
        this.updateBadges();
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const completedList = document.getElementById('completed-tasks-list');
        
        tasksList.innerHTML = '';
        completedList.innerHTML = '';
        
        const pendingTasks = this.tasks.filter(task => !task.completed);
        const completedTasks = this.tasks.filter(task => task.completed);
        
        // Update tasks count
        document.getElementById('tasks-count').textContent = `${pendingTasks.length} tugas belum selesai`;
        
        // Show/hide completed section
        document.getElementById('completed-tasks').style.display = completedTasks.length > 0 ? 'block' : 'none';
        
        // Render pending tasks
        pendingTasks.forEach(task => {
            tasksList.appendChild(this.createTaskElement(task));
        });
        
        // Render completed tasks
        completedTasks.forEach(task => {
            completedList.appendChild(this.createCompletedTaskElement(task));
        });
    }

    renderGoals() {
        const goalsList = document.getElementById('goals-list');
        goalsList.innerHTML = '';
        
        this.goals.forEach(goal => {
            goalsList.appendChild(this.createGoalElement(goal));
        });
    }

    renderReminders() {
        const remindersList = document.getElementById('reminders-list');
        const historyList = document.getElementById('history-list');
        
        remindersList.innerHTML = '';
        historyList.innerHTML = '';
        
        const activeReminders = this.reminders.filter(r => !r.interacted && r.notificationShown);
        const historyReminders = this.reminders.filter(r => r.interacted);
        
        // Show/hide history section
        document.getElementById('reminders-history').style.display = historyReminders.length > 0 ? 'block' : 'none';
        
        // Render active reminders
        activeReminders.forEach(reminder => {
            const task = this.tasks.find(t => t.id === reminder.taskId);
            if (task) {
                remindersList.appendChild(this.createReminderElement(reminder, task));
            }
        });
        
        // Render history
        historyReminders.forEach(reminder => {
            const task = this.tasks.find(t => t.id === reminder.taskId);
            if (task) {
                historyList.appendChild(this.createHistoryElement(reminder, task));
            }
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item priority-${task.priority} ${task.notified ? 'notified' : ''}`;
        
        const priorityIcon = this.getPriorityIcon(task.priority);
        const priorityText = this.getPriorityText(task.priority);
        
        div.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-priority">
                    ${priorityIcon}
                    <span>${priorityText}</span>
                    ${task.notified ? '<i data-lucide="bell" class="pulse"></i>' : ''}
                </div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                <div class="task-meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${this.formatDate(task.dueDate)}</span>
                </div>
                <div class="task-meta-item">
                    <i data-lucide="bell"></i>
                    <span>${task.reminderTime}</span>
                </div>
                ${task.optimalTime ? `
                <div class="task-meta-item">
                    <i data-lucide="clock"></i>
                    <span>Optimal: ${task.optimalTime}</span>
                </div>
                ` : ''}
                <div class="task-meta-item">
                    <span>${task.category}</span>
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
        
        // Add event listeners
        div.querySelector('.complete-btn').addEventListener('click', () => {
            this.toggleTaskCompletion(task.id);
        });
        
        div.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteTask(task.id);
        });
        
        return div;
    }

    createGoalElement(goal) {
        const div = document.createElement('div');
        div.className = 'goal-item';
        
        const progressPercentage = (goal.progress / goal.target) * 100;
        
        div.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">${goal.title}</div>
                <div class="goal-actions">
                    <button class="btn-outline delete-goal-btn" data-id="${goal.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="goal-description">
                Target: ${goal.target} ${goal.unit} • Selesai: ${this.formatDate(goal.targetDate)}
            </div>
            <div class="progress-container">
                <div class="progress-info">
                    <span>Progress: ${goal.progress}/${goal.target} ${goal.unit}</span>
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
        
        // Add event listeners
        div.querySelector('.progress-btn').addEventListener('click', () => {
            this.updateGoalProgress(goal.id);
        });
        
        div.querySelector('.delete-goal-btn').addEventListener('click', () => {
            this.deleteGoal(goal.id);
        });
        
        return div;
    }

    createReminderElement(reminder, task) {
        const div = document.createElement('div');
        div.className = 'task-item priority-high';
        
        div.innerHTML = `
            <div class="task-header">
                <div class="task-title">Pengingat Tugas</div>
                <div class="task-priority">
                    <i data-lucide="bell" class="pulse"></i>
                </div>
            </div>
            <div class="task-description">${reminder.message}</div>
            <div class="task-meta">
                <div class="task-meta-item">
                    <i data-lucide="clock"></i>
                    <span>${reminder.time}</span>
                </div>
                <div class="task-meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${this.formatDate(task.dueDate)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-primary respond-btn" data-id="${reminder.id}">
                    Tandai sebagai Dikerjakan
                </button>
            </div>
        `;
        
        div.querySelector('.respond-btn').addEventListener('click', () => {
            this.showReminderModal(reminder);
        });
        
        return div;
    }

    createCompletedTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'completed-task';
        
        div.innerHTML = `
            <div class="completed-task-text">
                <i data-lucide="check-circle"></i>
                <span>${task.title}</span>
            </div>
            <button class="btn-outline delete-btn" data-id="${task.id}">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        
        div.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteTask(task.id);
        });
        
        return div;
    }

    createHistoryElement(reminder, task) {
        const div = document.createElement('div');
        div.className = 'completed-task';
        
        div.innerHTML = `
            <div>
                <div class="completed-task-text">
                    <i data