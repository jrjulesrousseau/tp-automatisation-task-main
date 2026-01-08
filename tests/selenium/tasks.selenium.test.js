// Import des classes principales de Selenium WebDriver
// Builder : construit le driver
// By : permet de localiser des éléments (id, css, xpath…)
// until : conditions d’attente explicites
// Key : touches clavier (ENTER, ESC, etc.)
const { Builder, By, until, Key } = require('selenium-webdriver');

// Import spécifique pour configurer Chrome
const chrome = require('selenium-webdriver/chrome');

// Module HTTP Node.js pour lancer le serveur Express
const http = require('http');

// Import de l’application Express à tester
const app = require('../../src/app');

// Import du stockage des tâches (mock / mémoire)
const taskStore = require('../../src/models/taskStore');

// Suite de tests principale (Jest)
describe('Tests Selenium - Interface TaskFlow', () => {

  // Driver Selenium (navigateur automatisé)
  let driver;

  // Serveur HTTP local pour l’application
  let server;

  // Port utilisé pour lancer l’app en test
  const PORT = 3001;

  // URL de base de l’application testée
  const BASE_URL = `http://localhost:${PORT}`;

  // --------------------------------------------------
  // Fonction utilitaire : attendre l’ouverture de la modal
  // --------------------------------------------------
  async function waitForModalVisible(timeout = 5000) {

    // driver.wait : attend qu’une condition soit vraie
    await driver.wait(async () => {
      try {
        // Récupère l’overlay de la modal
        const overlay = await driver.findElement(By.id('modalOverlay'));

        // Récupère les classes CSS de l’overlay
        const classes = await overlay.getAttribute('class');

        // Si la modal n’est pas active → continuer à attendre
        if (!classes.includes('active')) return false;

        // Vérifie que la fenêtre modale est visible
        const modal = await driver.findElement(By.id('editModal'));
        return await modal.isDisplayed();
      } catch (e) {
        // Si élément non trouvé → continuer à attendre
        return false;
      }
    }, timeout);
  }

  // --------------------------------------------------
  // Fonction utilitaire : attendre la fermeture de la modal
  // --------------------------------------------------
  async function waitForModalHidden(timeout = 5000) {
    await driver.wait(async () => {
      try {
        const overlay = await driver.findElement(By.id('modalOverlay'));
        const classes = await overlay.getAttribute('class');

        // La modal est considérée fermée si la classe "active" a disparu
        return !classes.includes('active');
      } catch (e) {
        // Si l’élément n’existe plus → modal fermée
        return true;
      }
    }, timeout);
  }

  // --------------------------------------------------
  // Initialisation globale avant tous les tests
  // --------------------------------------------------
  beforeAll(async () => {

    // Création du serveur HTTP à partir de l’app Express
    server = http.createServer(app);

    // Démarrage du serveur sur le port défini
    await new Promise(resolve => server.listen(PORT, resolve));

    // Configuration de Chrome en mode headless (sans interface graphique)
    const options = new chrome.Options()
      .addArguments('--headless')                // Pas d’UI
      .addArguments('--no-sandbox')              // Nécessaire en CI
      .addArguments('--disable-dev-shm-usage')   // Évite les crashs mémoire
      .addArguments('--disable-gpu')             // Désactive l’accélération GPU
      .addArguments('--window-size=1920,1080');  // Taille écran stable

    // Construction du driver Selenium pour Chrome
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  // --------------------------------------------------
  // Nettoyage après tous les tests
  // --------------------------------------------------
  afterAll(async () => {

    // Ferme le navigateur Selenium
    if (driver) await driver.quit();

    // Arrête le serveur HTTP
    if (server) await new Promise(resolve => server.close(resolve));
  });

  // --------------------------------------------------
  // Préparation avant chaque test
  // --------------------------------------------------
  beforeEach(async () => {

    // Réinitialise le store des tâches (état propre)
    taskStore.clear();

    // Ouvre la page principale
    await driver.get(BASE_URL);

    // Attend que le formulaire principal soit chargé
    await driver.wait(until.elementLocated(By.id('taskForm')), 5000);

    // Petite pause pour stabiliser le DOM
    await driver.sleep(500);
  });

  // --------------------------------------------------
  // Tests de chargement initial de la page
  // --------------------------------------------------
  describe('Chargement de la page', () => {

    it('devrait afficher le titre de l\'application', async () => {
      const title = await driver.getTitle();
      expect(title).toContain('TaskFlow');
    });

    it('devrait afficher le formulaire de création', async () => {
      const form = await driver.findElement(By.id('taskForm'));
      expect(await form.isDisplayed()).toBe(true);
    });

    it('devrait afficher les statistiques à zéro', async () => {
      const totalTasks = await driver.findElement(By.id('totalTasks'));
      expect(await totalTasks.getText()).toBe('0');
    });

    it('devrait afficher l\'état vide', async () => {
      const emptyState = await driver.findElement(By.css('.empty-state'));
      expect(await emptyState.isDisplayed()).toBe(true);
    });
  });

  // --------------------------------------------------
  // Tests de création de tâches
  // --------------------------------------------------
  describe('Création de tâches', () => {

    it('devrait créer une tâche avec titre seulement', async () => {

      // Saisie du titre
      const titleInput = await driver.findElement(By.id('title'));
      await titleInput.sendKeys('Ma première tâche');

      // Soumission du formulaire
      const submitBtn = await driver.findElement(By.id('submitBtn'));
      await submitBtn.click();

      // Attente de l’apparition de la tâche
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);

      // Vérification du titre affiché
      const taskTitle = await driver.findElement(By.css('.task-title'));
      expect(await taskTitle.getText()).toBe('Ma première tâche');
    });

    it('devrait créer une tâche complète', async () => {

      // Remplissage des champs
      await driver.findElement(By.id('title')).sendKeys('Tâche complète');
      await driver.findElement(By.id('description')).sendKeys('Description détaillée');

      // Sélection de la priorité
      const prioritySelect = await driver.findElement(By.id('priority'));
      await prioritySelect.click();
      await driver.findElement(By.css('#priority option[value="high"]')).click();

      // Soumission
      await driver.findElement(By.id('submitBtn')).click();

      // Vérification de la description et de la priorité
      const taskDescription = await driver.findElement(By.css('.task-description'));
      expect(await taskDescription.getText()).toBe('Description détaillée');

      const priorityIndicator = await driver.findElement(By.css('.task-priority.high'));
      expect(await priorityIndicator.isDisplayed()).toBe(true);
    });
  });

  // --------------------------------------------------
  // Tests de filtrage des tâches
  // --------------------------------------------------
  describe('Affichage et filtrage des tâches', () => {

    beforeEach(async () => {

      // Préchargement de données
      taskStore.create({ title: 'Tâche en attente', status: 'pending' });
      taskStore.create({ title: 'Tâche en cours', status: 'in-progress' });
      taskStore.create({ title: 'Tâche terminée', status: 'completed' });

      // Rafraîchissement de la page
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
    });

    it('devrait filtrer par statut "En attente"', async () => {
      await driver.findElement(By.css('[data-filter="pending"]')).click();
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
    });
  });

  // --------------------------------------------------
  // Tests de suppression
  // --------------------------------------------------
  describe('Suppression de tâches', () => {

    beforeEach(async () => {
      taskStore.create({ title: 'Tâche à supprimer' });
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
    });

    it('devrait supprimer une tâche après confirmation', async () => {

      // Clique sur le bouton supprimer
      await driver.findElement(By.css('.action-btn.delete')).click();

      // Accepte la boîte de confirmation JavaScript
      await driver.switchTo().alert().accept();

      // Vérifie que la tâche n’existe plus
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(0);
    });
  });
});

/* const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { spawn } = require('child_process');

jest.setTimeout(30000);

let driver;
let server;
const BASE_URL = 'http://localhost:4001';

beforeAll(async () => {
  server = spawn('node', ['src/app.js'], {
    env: { ...process.env, PORT: 4001 },
    stdio: 'inherit'
  });

  await new Promise(res => setTimeout(res, 3000));

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(
      new chrome.Options().addArguments('--headless=new', '--no-sandbox')
    )
    .build();
});

afterAll(async () => {
  if (driver) await driver.quit();
  if (server) server.kill();
});

beforeEach(async () => {
  await driver.get(BASE_URL);

  await driver.executeAsyncScript(function (done) {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(tasks =>
        Promise.all(tasks.map(t =>
          fetch(`/api/tasks/${t.id}`, { method: 'DELETE' })
        ))
      )
      .then(() => done());
  });

  await driver.navigate().refresh();
});

// Création d'une tâche

async function createTask(title = 'Task', priority = 'medium', desc = '') {
  await driver.findElement(By.id('title')).sendKeys(title);
  await driver.findElement(By.id('priority')).sendKeys(priority);
  await driver.findElement(By.id('description')).sendKeys(desc);

  await driver.findElement(By.id('submitBtn')).click();

  await driver.wait(
    until.elementLocated(By.css('.task-card')),
    5000
  );
}

// TESTS

/*
test('1 - La page se charge correctement', async () => {
  const title = await driver.findElement(By.css('.section-title'));
  expect(title).toContain('Nouvelle Tâche');
});


test('2 - Le formulaire est présent', async () => {
  const form = await driver.findElement(By.id('taskForm'));
  expect(form).toBeDefined();
});

test('3 - Création d’une tâche', async () => {
  await createTask(title = 'Première tâche !', desc = 'Ceci est une description');
  const task = await driver.findElement(By.css('.task-card'));
  expect(await task.getText()).toContain('Première tâche !');
});

test('4 - Modifier la description', async () => {
  await createTask(title = 'Tâche à modifier (description)');
  await driver.findElement(By.css('[title="Modifier"]')).click();
  await driver.findElement(By.id('editDescription')).sendKeys('Descritpion ajoutée');
  await driver.findElement(By.css('button[type="submit"]:nth-of-type(2)')).click();
  await driver.wait(
        until.elementLocated(By.css('.task-card')),
        5000
      );
});

test('5 - Création avec priorité moyenne', async () => {
  await createTask(title = 'Priorité moyenne', priority = 'medium');
  const select = driver.findElement(By.id('priority'))
  await select.findElement(By.css("option[value='medium']")).click();
  
  const selectedOption = await select.getAttribute('value');
  expect(selectedOption).toContain('medium');
});

test('6 - Création avec priorité haute', async () => {
  await createTask(title = 'Priorité haute', priority = 'high');
  const select = driver.findElement(By.id('priority'))
  await select.findElement(By.css("option[value='high']")).click();
  
  const selectedOption = await select.getAttribute('value');
  expect(selectedOption).toContain('high');
});

test('7 - Création avec priorité basse', async () => {
  await createTask(title = 'Priorité basse', priority = 'low');
  const select = driver.findElement(By.id('priority'))
  await select.findElement(By.css("option[value='low']")).click();
  
  const selectedOption = await select.getAttribute('value');
  expect(selectedOption).toContain('low');
});

test('8 - Plusieurs tâches ajoutées', async () => {
  await createTask('Première tâche');
  await createTask('Deuxième tâche');
  const tasks = await driver.findElements(By.css('.task-card'));
  expect(tasks.length).toBe(2);
});

test('9 - Le compteur total augmente', async () => {
  await createTask('Stats');
  const counter = await driver.findElement(By.id('totalTasks'));
  expect(parseInt(await counter.getText())).toBe(1);
});

test('10 - Suppression d’une tâche', async () => {
  await createTask('À supprimer');
  await driver.findElement(By.css('[title="Supprimer"]')).click();
  await driver.switchTo().alert().accept();

  const tasks = await driver.findElements(By.css('.task-card'));
  expect(tasks.length).toBe(0);
});

test('11 - Ouverture du modal d’édition', async () => {
  await createTask('À éditer');
  await driver.findElement(By.css('[title="Modifier"]')).click();
  const modal = await driver.findElement(By.id('editModal'));
  expect(await modal.isDisplayed()).toBe(true);
});

test('12 - Modification du titre', async () => {
  await createTask('Titre avant');
  await driver.findElement(By.css('[title="Modifier"]')).click();

  const input = await driver.findElement(By.css('[name="title"]'));
  await input.clear();
  await input.sendKeys('Titre après');
  await driver.findElement(By.css('button[type="submit"]:nth-of-type(2)')).click();
  expect(await driver.findElement(By.css('.task-title'))).toContain('Titre après');
});

test('13 - Changement de statut → En attente', async () => {
  await createTask('Statut En attente');
  const task = await driver.findElement(By.css('.task-status'));
  expect(await task.getText()).toContain('EN ATTENTE');
});

test('14 - Changement de statut → En cours', async () => {
  await createTask('Statut En cours');
  await driver.findElement(By.css('[title="Changer le statut"]')).click();
  const task = await driver.findElement(By.css('.task-status'));
  expect(await task.getText()).toContain('EN COURS');
});

test('15 - Changement de statut → Terminée', async () => {
  await createTask('Statut En cours');
  await driver.findElement(By.css('[title="Changer le statut"]')).click();
  const task = await driver.findElement(By.css('.task-status'));
  expect(await task.getText()).toContain('Terminée');
}); */