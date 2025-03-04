import { defineConfig } from 'cypress';
import cloudPlugin from 'cypress-cloud/plugin';

export default defineConfig({
  projectId: 'jellyseerr',
  e2e: {
    baseUrl: 'http://localhost:5055',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    setupNodeEvents(on, config) {
      cloudPlugin(on, config);
      return config;
    },
    experimentalSessionAndOrigin: true,
  },
  env: {
    ADMIN_EMAIL: 'admin@seerr.dev',
    ADMIN_PASSWORD: 'test1234',
    USER_EMAIL: 'friend@seerr.dev',
    USER_PASSWORD: 'test1234',
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
});
