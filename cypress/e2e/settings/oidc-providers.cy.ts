describe('OpenID Connect Provider Settings', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.request('POST', '/api/v1/settings/oidc', { providers: [] });
    cy.request('POST', '/api/v1/settings/main', { oidcLogin: true });
  });

  afterEach(() => {
    cy.request('POST', '/api/v1/settings/oidc', { providers: [] });
    cy.request('POST', '/api/v1/settings/main', { oidcLogin: false });
  });

  it('shows the OpenID Connect login toggle and provider section', () => {
    cy.visit('/settings/users');

    cy.get('.heading').should('contain', 'User Settings');
    cy.get('#oidcLogin').should('exist');
    cy.get('button').contains('Add Provider').should('exist');
  });

  it('adds a provider with an auto-generated slug', () => {
    cy.visit('/settings/users');

    cy.get('button').contains('Add Provider').click();
    cy.get('[data-testid=modal-title]').should(
      'contain',
      'Add New OpenID Connect Provider'
    );

    cy.get('#name').type('Keycloak');
    cy.get('#slug').should('have.value', 'keycloak');
    cy.get('#issuerUrl').type('https://keycloak.example.com/realms/master/');
    cy.get('#clientId').type('seerr');
    cy.get('#clientSecret').type('SUPER_SECRET_STRING');
    cy.get('[data-testid=modal-ok-button]').click();

    cy.get('[data-testid=modal-title]').should('not.exist');
    cy.contains('Keycloak').should('exist');

    cy.request('GET', '/api/v1/settings/oidc')
      .its('body.providers')
      .should('have.length', 1);

    // Public settings should now expose the provider
    cy.request('GET', '/api/v1/settings/public')
      .its('body.openIdProviders')
      .should('have.length', 1);
  });

  it('edits a provider', () => {
    cy.request('POST', '/api/v1/settings/oidc', {
      providers: [
        {
          slug: 'authentik',
          name: 'Authentik',
          issuerUrl: 'https://authentik.example.com/application/o/seerr/',
          clientId: 'seerr',
          clientSecret: 'SUPER_SECRET_STRING',
        },
      ],
    });

    cy.visit('/settings/users');

    cy.get('button').contains('Edit').click();
    cy.get('[data-testid=modal-title]').should(
      'contain',
      'Edit OpenID Connect Provider'
    );

    cy.get('#name').clear();
    cy.get('#name').type('Authentik Prod');
    cy.get('[data-testid=modal-ok-button]').click();

    cy.get('[data-testid=modal-title]').should('not.exist');
    cy.contains('Authentik Prod').should('exist');

    cy.request('GET', '/api/v1/settings/oidc')
      .its('body.providers.0.name')
      .should('eq', 'Authentik Prod');
  });

  it('deletes a provider', () => {
    cy.request('POST', '/api/v1/settings/oidc', {
      providers: [
        {
          slug: 'pocket-id',
          name: 'Pocket-ID',
          issuerUrl: 'https://pocketid.example.com/',
          clientId: 'seerr',
          clientSecret: 'SUPER_SECRET_STRING',
        },
      ],
    });

    cy.visit('/settings/users');

    cy.contains('Pocket-ID').should('exist');

    // ConfirmButton requires a second click to confirm
    cy.get('button').contains('Delete').click();
    cy.get('button').contains('Are you sure?').click();

    cy.contains('Pocket-ID').should('not.exist');
    cy.contains('No OpenID Connect providers configured.').should('exist');

    cy.request('GET', '/api/v1/settings/oidc')
      .its('body.providers')
      .should('have.length', 0);
  });

  it('rejects duplicate provider slugs', () => {
    cy.request('POST', '/api/v1/settings/oidc', {
      providers: [
        {
          slug: 'keycloak',
          name: 'Keycloak',
          issuerUrl: 'https://keycloak.example.com/realms/master/',
          clientId: 'seerr',
          clientSecret: 'SUPER_SECRET_STRING',
        },
      ],
    });

    cy.visit('/settings/users');

    cy.get('button').contains('Add Provider').click();
    cy.get('#name').type('Keycloak');
    cy.get('#slug').should('have.value', 'keycloak');
    cy.get('#issuerUrl').type('https://keycloak.example.com/realms/master/');
    cy.get('#clientId').type('seerr');
    cy.get('#clientSecret').type('SUPER_SECRET_STRING');

    // Trigger validation on the slug field
    cy.get('#slug').focus().blur();

    cy.get('.error')
      .contains('A provider with this slug already exists')
      .should('be.visible');
    cy.get('[data-testid=modal-ok-button]').should('be.disabled');
    cy.get('[data-testid=modal-title]').should('exist');

    // The save button re-enables once the conflict is resolved
    cy.get('#slug').clear();
    cy.get('#slug').type('keycloak-2');
    cy.get('#slug').focus().blur();
    cy.get('[data-testid=modal-ok-button]').should('be.enabled');

    cy.get('[data-testid=modal-ok-button]').click();
    cy.get('[data-testid=modal-title]').should('not.exist');
    cy.contains('Keycloak').should('exist');
  });
});
