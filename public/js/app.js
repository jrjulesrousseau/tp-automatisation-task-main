// API Base URL
const API_URL = '/api/tasks';

// DOM Elements
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const editForm = document.getElementById('editForm');
const modalClose = document.getElementById('modalClose');
const cancelEdit = document.getElementById('cancelEdit');
const filterBtns = document.querySelectorAll('.filter-btn');
const toast = document.getElementById('toast');

// Stats elements
const totalTasksEl = document.getElementById('totalTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const completedTasksEl = document.getElementById('completedTasks');

// State
let tasks = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  taskForm.addEventListener('submit', handleCreateTask);
  editForm.addEventListener('submit', handleUpdateTask);
  modalClose.addEventListener('click', closeModal);
  cancelEdit.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}

// API Functions
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Erreur lors du chargement');
    tasks = await response.json();
    renderTasks();
    updateStats();
  } catch (error) {
    showToast('Erreur lors du chargement des tâches', 'error');
    console.error(error);
  }
}

async function createTask(taskData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    const task = await response.json();
    tasks.unshift(task);
    renderTasks();
    updateStats();
    showToast('Tâche créée avec succès', 'success');
    return task;
  } catch (error) {
    showToast(error.message || 'Erreur lors de la création', 'error');
    throw error;
  }
}

async function updateTask(id, taskData) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    const updatedTask = await response.json();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = updatedTask;
    }
    renderTasks();
    updateStats();
    showToast('Tâche mise à jour', 'success');
    return updatedTask;
  } catch (error) {
    showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    throw error;
  }
}

async function deleteTask(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression');
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    updateStats();
    showToast('Tâche supprimée', 'success');
  } catch (error) {
    showToast('Erreur lors de la suppression', 'error');
    console.error(error);
  }
}

// Form Handlers
async function handleCreateTask(e) {
  e.preventDefault();
  const formData = new FormData(taskForm);
  const taskData = {
    title: formData.get('title').trim(),
    description: formData.get('description').trim(),
    priority: formData.get('priority')
  };

  if (!taskData.title) {
    showToast('Le titre est requis', 'error');
    return;
  }

  try {
    await createTask(taskData);
    taskForm.reset();
    document.getElementById('priority').value = 'medium';
  } catch (error) {
    // Error already handled in createTask
  }
}

async function handleUpdateTask(e) {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const taskData = {
    title: document.getElementById('editTitle').value.trim(),
    description: document.getElementById('editDescription').value.trim(),
    status: document.getElementById('editStatus').value,
    priority: document.getElementById('editPriority').value
  };

  if (!taskData.title) {
    showToast('Le titre est requis', 'error');
    return;
  }

  try {
    await updateTask(id, taskData);
    closeModal();
  } catch (error) {
    // Error already handled in updateTask
  }
}

// Render Functions
function renderTasks() {
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'all') return true;
    return task.status === currentFilter;
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '';
    tasksList.appendChild(createEmptyState());
    return;
  }

  tasksList.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');

  // Add event listeners to task cards
  tasksList.querySelectorAll('.action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  tasksList.querySelectorAll('.action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Supprimer cette tâche ?')) {
        deleteTask(btn.dataset.id);
      }
    });
  });

  tasksList.querySelectorAll('.action-btn.toggle').forEach(btn => {
    btn.addEventListener('click', () => toggleTaskStatus(btn.dataset.id));
  });
}

function createTaskCard(task) {
  const statusLabels = {
    'pending': 'En attente',
    'in-progress': 'En cours',
    'completed': 'Terminée'
  };

  const priorityLabels = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🔴'
  };

  const date = new Date(task.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return `
    <div class="task-card ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-priority ${task.priority}"></div>
      <div class="task-content">
        <div class="task-header">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="task-status ${task.status}">${statusLabels[task.status]}</span>
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          ${priorityLabels[task.priority]} Priorité ${task.priority} • Créée le ${date}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn toggle" data-id="${task.id}" title="Changer le statut">
          ${task.status === 'completed' ? '↩' : '✓'}
        </button>
        <button class="action-btn edit" data-id="${task.id}" title="Modifier">
          ✎
        </button>
        <button class="action-btn delete" data-id="${task.id}" title="Supprimer">
          ✕
        </button>
      </div>
    </div>
  `;
}

function createEmptyState() {
  const messages = {
    'all': { icon: '📭', title: 'Aucune tâche pour le moment', subtitle: 'Créez votre première tâche ci-dessus' },
    'pending': { icon: '⏳', title: 'Aucune tâche en attente', subtitle: 'Toutes vos tâches sont en cours ou terminées' },
    'in-progress': { icon: '🚀', title: 'Aucune tâche en cours', subtitle: 'Commencez une tâche pour la voir ici' },
    'completed': { icon: '🎉', title: 'Aucune tâche terminée', subtitle: 'Terminez une tâche pour la voir ici' }
  };

  const msg = messages[currentFilter];
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-icon">${msg.icon}</div>
    <p>${msg.title}</p>
    <span>${msg.subtitle}</span>
  `;
  return div;
}

// Modal Functions
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('editId').value = task.id;
  document.getElementById('editTitle').value = task.title;
  document.getElementById('editDescription').value = task.description || '';
  document.getElementById('editStatus').value = task.status;
  document.getElementById('editPriority').value = task.priority;

  modalOverlay.classList.add('active');
  document.getElementById('editTitle').focus();
}

function closeModal() {
  modalOverlay.classList.remove('active');
  editForm.reset();
}

// Toggle task status
async function toggleTaskStatus(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const nextStatus = {
    'pending': 'in-progress',
    'in-progress': 'completed',
    'completed': 'pending'
  };

  await updateTask(id, { status: nextStatus[task.status] });
}

// Update stats
function updateStats() {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;

  animateNumber(totalTasksEl, total);
  animateNumber(pendingTasksEl, pending + inProgress);
  animateNumber(completedTasksEl, completed);
}

function animateNumber(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 300;
  const steps = 10;
  const stepDuration = duration / steps;
  const increment = (target - current) / steps;

  let step = 0;
  const timer = setInterval(() => {
    step++;
    if (step >= steps) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current + increment * step);
    }
  }, stepDuration);
}

// Toast notification
function showToast(message, type = 'success') {
  toast.querySelector('.toast-message').textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
