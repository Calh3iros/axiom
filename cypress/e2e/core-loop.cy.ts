export {};
const locales = ['en', 'pt', 'es', 'fr', 'de', 'zh'];

locales.forEach((locale) => {
  describe(`Core Loop (Free User) - ${locale}`, () => {
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

    it('Creates account, resolves a question, verifies limits, and logs out', () => {
      const uniqueId = Date.now();
      const testEmail = `cypress-free-${uniqueId}@example.com`;
      const testPassword = 'TestPassword123!';

      // 1. Visit Landing Page
      cy.visit(`/${locale}`);
      
      // 2. Navigate to Sign Up
      cy.visit(`/${locale}/auth/signup`);

      // 3. Fill Sign Up Form
      cy.get('#name').type(`Cypress ${locale.toUpperCase()}`);
      cy.get('#email').type(testEmail);
      cy.get('#password').type(testPassword);

      // We find the button by getting its translated text
      cy.get('button[type="submit"]').click();

      // 4. Verify Redirect to Solve Dashboard
      cy.url().should('include', `/${locale}/solve`);
      
      // 5. Ask a Question
      cy.get('textarea').should('be.visible').type('What is the capital of France? Give a very short answer.{enter}');

      // 6. Wait for AI response (Modifiers button appears)
      cy.contains(t('Dashboard.Components.modifiers', 'Modifiers'), { timeout: 15000 }).should('be.visible');

      // 7. Check Limits Usage
      cy.visit(`/${locale}/settings`);
      cy.contains(t('Dashboard.Sidebar.free', 'FREE')).should('be.visible');

      // 8. Sign Out
      cy.contains(t('Dashboard.Sidebar.signOut', 'Sign Out')).click();
      cy.url().should('include', `/${locale}/auth/login`);
    });
  });
});
