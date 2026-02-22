import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    chromeWebSecurity: false, // Helps with cross-origin Stripe redirects
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Prevent tests from failing if next-intl router throws innocent exceptions
    env: {
      testEmail: 'cypress-test@example.com'
    }
  },
});
