import './commands';

before(() => {
  if (Cypress.env('SEED_DATABASE')) {
    cy.exec('pnpm cypress:prepare');
  }
});
