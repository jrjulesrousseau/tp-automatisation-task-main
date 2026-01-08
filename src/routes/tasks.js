const express = require('express');
const router = express.Router();
const taskStore = require('../models/taskStore');

// GET - Liste toutes les tâches
router.get('/', (req, res) => {
  const tasks = taskStore.getAll();
  res.json(tasks);
});

// GET - Récupère une tâche par ID
router.get('/:id', (req, res) => {
  const task = taskStore.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  res.json(task);
});

// POST - Crée une nouvelle tâche
router.post('/', (req, res) => {
  const { title, description, status, priority } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Le titre est requis' });
  }

  const task = taskStore.create({ title, description, status, priority });
  res.status(201).json(task);
});

// PUT - Met à jour une tâche
router.put('/:id', (req, res) => {
  const { title, description, status, priority } = req.body;
  
  if (title !== undefined && title.trim() === '') {
    return res.status(400).json({ error: 'Le titre ne peut pas être vide' });
  }

  // Filtrer les champs undefined
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;

  const task = taskStore.update(req.params.id, updateData);
  if (!task) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  res.json(task);
});

// DELETE - Supprime une tâche
router.delete('/:id', (req, res) => {
  const deleted = taskStore.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Tâche non trouvée' });
  }
  res.status(204).send();
});

module.exports = router;
