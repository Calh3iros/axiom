export {};
const locales = ['en', 'pt', 'es', 'fr', 'de', 'zh'];

locales.forEach((locale) => {
  describe(`Monetization (Pro Checkout) - ${locale}`, () => {
    let dict: any;

    before(() => {
      cy.readFile(`src/messages/${locale}.json`).then((json) => {
        dict = json;
      });
    });

    const t = (key: string, fallback: string = key) => {
      const result = key.split('.').reduce((o: any, i: string) => (o ? o[i] : undefined), dict);
      return result || fallback;
    };

    it('Upgrades to Pro via Stripe checkout, verifies Pro badge, and cancels plan', () => {
      const uniqueId = Date.now();
      const testEmail = `cypress-pro-${uniqueId}@example.com`;
      const testPassword = 'TestPassword123!';

      // 1. Setup User Account
      cy.visit(`/${locale}/auth/signup`);
      cy.get('#name').type(`Pro Tester ${locale.toUpperCase()}`);
      cy.get('#email').type(testEmail);
      cy.get('#password').type(testPassword);
      cy.get('button[type="submit"]').click();

      // 2. Navigate to Write/Humanizer module
      cy.url().should('include', `/${locale}/solve`);
      cy.contains(t('Dashboard.Sidebar.write', 'Write')).click();

      // 3. Hit Humanizer Word Limit
      const longText = Array(600).fill('word').join(' ');
      cy.get('textarea').type(longText, { delay: 0 }); // disable typing delay for huge text

      // Click "Humanize" button
      cy.contains(t('Dashboard.Components.humanize', 'Humanize')).click();

      // 4. Paywall should appear
      // We check for the Upgrade button instead of strict translated title string
      cy.get('button').filter(':contains("Subscribe"), :contains("Upgrade")').first().should('be.visible');

      // 5. Click Upgrade (Proceed to Stripe Checkout)
      // Cypress requires cross-origin workaround for Stripe, but clicking the button that triggers window.location = checkoutSessionUrl works if `chromeWebSecurity: false` or using `cy.origin()`.
      // The easiest way is to let Cypress follow the redirect if configured, or just verify the button exists for now.
      cy.get('button').filter(':contains("Subscribe"), :contains("Upgrade")').first().click();

      // Assuming `chromeWebSecurity: false` is set in cypress.config.ts, we can interact with Stripe.
      cy.origin('https://checkout.stripe.com', () => {
        // Wait for Stripe Checkout to load
        cy.get('#email').type(Cypress.env('testEmail') || 'test@example.com');
        cy.get('#cardNumber').type('4242424242424242');
        cy.get('#cardExpiry').type('1234');
        cy.get('#cardCvc').type('123');
        cy.get('#billingName').type('Test User');
        cy.get('.SubmitButton').click();
      });

      // 7. Return and Verify PRO Badge
      cy.url({ timeout: 25000 }).should('include', `/${locale}/solve?session_id=`);
      cy.contains('PRO ✨', { timeout: 10000 }).should('be.visible');

      // 8. Open Settings and Cancel Subscription
      cy.contains(t('Dashboard.Sidebar.settings', 'Settings')).click();
      cy.url().should('include', `/${locale}/settings`);
      
      cy.contains(t('Dashboard.Settings.manageSubscription', 'Manage Subscription')).click();

      cy.origin('https://billing.stripe.com', () => {
        cy.contains('Cancel plan').click();
        cy.get('button').contains('Cancel plan').click();
      });
    });
  });
});
