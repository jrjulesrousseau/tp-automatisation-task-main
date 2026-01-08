const { Builder, By, until } = require('selenium-webdriver');
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
*/

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
});