// Setup global pour les tests
jest.setTimeout(30000);

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
