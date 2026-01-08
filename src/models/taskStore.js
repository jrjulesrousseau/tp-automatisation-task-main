const { v4: uuidv4 } = require('uuid');

class TaskStore {
  constructor() {
    this.tasks = new Map();
  }

  getAll() {
    return Array.from(this.tasks.values());
  }

  getById(id) {
    return this.tasks.get(id) || null;
  }

  create(taskData) {
    const task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id, taskData) {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      return null;
    }
    const updatedTask = {
      ...existingTask,
      ...taskData,
      id: existingTask.id,
      createdAt: existingTask.createdAt,
      updatedAt: new Date().toISOString()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  delete(id) {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }
    this.tasks.delete(id);
    return true;
  }

  clear() {
    this.tasks.clear();
  }

  count() {
    return this.tasks.size;
  }
}

module.exports = new TaskStore();
module.exports.TaskStore = TaskStore;
