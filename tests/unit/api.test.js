const request = require('supertest');
const app = require('../../src/app');
const taskStore = require('../../src/models/taskStore');

describe('API Tasks', () => {
  beforeEach(() => {
    taskStore.clear();
  });

  describe('GET /api/tasks', () => {
    it('devrait retourner un tableau vide initialement', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('devrait retourner toutes les tâches', async () => {
      taskStore.create({ title: 'Task 1' });
      taskStore.create({ title: 'Task 2' });

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('devrait retourner une tâche existante', async () => {
      const task = taskStore.create({ title: 'Find Me' });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .expect(200);

      expect(response.body.title).toBe('Find Me');
      expect(response.body.id).toBe(task.id);
    });

    it('devrait retourner 404 pour une tâche inexistante', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Tâche non trouvée');
    });
  });

  describe('POST /api/tasks', () => {
    it('devrait créer une nouvelle tâche', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.title).toBe('New Task');
      expect(response.body.description).toBe('Task description');
      expect(response.body.priority).toBe('high');
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('id');
    });

    it('devrait retourner 400 si le titre est manquant', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ description: 'No title' })
        .expect(400);

      expect(response.body.error).toBe('Le titre est requis');
    });

    it('devrait retourner 400 si le titre est vide', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '   ' })
        .expect(400);

      expect(response.body.error).toBe('Le titre est requis');
    });

    it('devrait utiliser les valeurs par défaut', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Minimal Task' })
        .expect(201);

      expect(response.body.priority).toBe('medium');
      expect(response.body.status).toBe('pending');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('devrait mettre à jour une tâche existante', async () => {
      const task = taskStore.create({ title: 'Original' });

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ title: 'Updated', status: 'completed' })
        .expect(200);

      expect(response.body.title).toBe('Updated');
      expect(response.body.status).toBe('completed');
    });

    it('devrait retourner 404 pour une tâche inexistante', async () => {
      const response = await request(app)
        .put('/api/tasks/non-existent')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Tâche non trouvée');
    });

    it('devrait retourner 400 si le titre est vide', async () => {
      const task = taskStore.create({ title: 'Original' });

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body.error).toBe('Le titre ne peut pas être vide');
    });

    it('devrait permettre la mise à jour partielle', async () => {
      const task = taskStore.create({ 
        title: 'Original', 
        description: 'Original Desc',
        priority: 'low' 
      });

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ priority: 'high' })
        .expect(200);

      expect(response.body.title).toBe('Original');
      expect(response.body.description).toBe('Original Desc');
      expect(response.body.priority).toBe('high');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('devrait supprimer une tâche existante', async () => {
      const task = taskStore.create({ title: 'To Delete' });

      await request(app)
        .delete(`/api/tasks/${task.id}`)
        .expect(204);

      expect(taskStore.getById(task.id)).toBeNull();
    });

    it('devrait retourner 404 pour une tâche inexistante', async () => {
      const response = await request(app)
        .delete('/api/tasks/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Tâche non trouvée');
    });
  });

  describe('Routes inexistantes', () => {
    it('devrait retourner 404 pour une route inconnue', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body.error).toBe('Route non trouvée');
    });
  });
});
