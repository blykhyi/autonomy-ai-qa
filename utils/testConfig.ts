export const testConfig = {
  projectName: process.env.TEST_PROJECT_NAME?.trim() || 'vite-react-sample',
  prompt:
    process.env.TEST_PROMPT?.trim() ||
    'Create pagination for cards when amount exceeds 6 cards on page',
  authStorageStatePath: '.auth/storageState.json',
};

