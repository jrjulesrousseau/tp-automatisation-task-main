const { TaskStore } = require('../../src/models/taskStore');

describe('TaskStore', () => {
  let store;

  beforeEach(() => {
    store = new TaskStore();
  });

  describe('create()', () => {
    it('devrait créer une tâche avec les données fournies', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high'
      };

      const task = store.create(taskData);

      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('pending');
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
    });

    it('devrait utiliser les valeurs par défaut', () => {
      const task = store.create({ title: 'Simple Task' });

      expect(task.description).toBe('');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('medium');
    });

    it('devrait générer des IDs uniques', () => {
      const task1 = store.create({ title: 'Task 1' });
      const task2 = store.create({ title: 'Task 2' });

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('getAll()', () => {
    it('devrait retourner un tableau vide initialement', () => {
      const tasks = store.getAll();
      expect(tasks).toEqual([]);
    });

    it('devrait retourner toutes les tâches créées', () => {
      store.create({ title: 'Task 1' });
      store.create({ title: 'Task 2' });
      store.create({ title: 'Task 3' });

      const tasks = store.getAll();
      expect(tasks).toHaveLength(3);
    });
  });

  describe('getById()', () => {
    it('devrait retourner la tâche correspondante', () => {
      const created = store.create({ title: 'Find Me' });
      const found = store.getById(created.id);

      expect(found).toEqual(created);
    });

    it('devrait retourner null si la tâche n\'existe pas', () => {
      const found = store.getById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('update()', () => {
    it('devrait mettre à jour les champs fournis', () => {
      const task = store.create({ title: 'Original', priority: 'low' });
      
      const updated = store.update(task.id, {
        title: 'Updated',
        status: 'completed'
      });

      expect(updated.title).toBe('Updated');
      expect(updated.status).toBe('completed');
      expect(updated.priority).toBe('low'); // Non modifié
    });

    it('devrait préserver l\'ID et la date de création', () => {
      const task = store.create({ title: 'Original' });
      const originalCreatedAt = task.createdAt;

      const updated = store.update(task.id, { title: 'Updated' });

      expect(updated.id).toBe(task.id);
      expect(updated.createdAt).toBe(originalCreatedAt);
    });

    it('devrait mettre à jour updatedAt', async () => {
      const task = store.create({ title: 'Original' });
      const originalUpdatedAt = task.updatedAt;

      // Attendre un peu pour avoir une date différente
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = store.update(task.id, { title: 'Updated' });

      expect(new Date(updated.updatedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());
    });

    it('devrait retourner null si la tâche n\'existe pas', () => {
      const result = store.update('non-existent', { title: 'New' });
      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    it('devrait supprimer la tâche et retourner true', () => {
      const task = store.create({ title: 'To Delete' });
      
      const result = store.delete(task.id);
      
      expect(result).toBe(true);
      expect(store.getById(task.id)).toBeNull();
    });

    it('devrait retourner false si la tâche n\'existe pas', () => {
      const result = store.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('count()', () => {
    it('devrait retourner le nombre de tâches', () => {
      expect(store.count()).toBe(0);

      store.create({ title: 'Task 1' });
      expect(store.count()).toBe(1);

      store.create({ title: 'Task 2' });
      expect(store.count()).toBe(2);
    });
  });

  describe('clear()', () => {
    it('devrait supprimer toutes les tâches', () => {
      store.create({ title: 'Task 1' });
      store.create({ title: 'Task 2' });
      
      store.clear();
      
      expect(store.count()).toBe(0);
      expect(store.getAll()).toEqual([]);
    });
  });
});
