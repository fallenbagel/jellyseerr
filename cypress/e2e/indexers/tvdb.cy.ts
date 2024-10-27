describe('TVDB Integration', () => {
  // Constants for routes and selectors
  const ROUTES = {
    home: '/',
    tvdbSettings: '/settings/tvdb',
    tomorrowIsOursTvShow: '/tv/72879',
    monsterTvShow: '/tv/225634',
  };

  const SELECTORS = {
    sidebarToggle: '[data-testid=sidebar-toggle]',
    sidebarSettingsMobile: '[data-testid=sidebar-menu-settings-mobile]',
    settingsNavDesktop: 'nav[data-testid="settings-nav-desktop"]',
    tvdbEnable: 'input[data-testid="tvdb-enable"]',
    tvdbSaveButton: '[data-testid=tvbd-save-button]',
    heading: '.heading',
    season1: 'Season 1',
    season2: 'Season 2',
  };

  // Reusable commands
  const toggleTVDBSetting = () => {
    cy.intercept('/api/v1/settings/tvdb').as('tvdbRequest');
    cy.get(SELECTORS.tvdbSaveButton).click();
    return cy.wait('@tvdbRequest');
  };

  const verifyTVDBResponse = (response, expectedUseValue) => {
    expect(response.statusCode).to.equal(200);
    expect(response.body.use).to.equal(expectedUseValue);
  };

  beforeEach(() => {
    // Perform login
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));

    // Navigate to TVDB settings
    cy.visit(ROUTES.home);
    cy.get(SELECTORS.sidebarToggle).click();
    cy.get(SELECTORS.sidebarSettingsMobile).click();
    cy.get(
      `${SELECTORS.settingsNavDesktop} a[href="${ROUTES.tvdbSettings}"]`
    ).click();

    // Verify heading
    cy.get(SELECTORS.heading).should('contain', 'Tvdb');

    // Configure TVDB settings
    cy.get(SELECTORS.tvdbEnable).then(($checkbox) => {
      const isChecked = $checkbox.is(':checked');

      if (!isChecked) {
        // If disabled, enable TVDB
        cy.wrap($checkbox).click();
        toggleTVDBSetting().then(({ response }) => {
          verifyTVDBResponse(response, true);
        });
      } else {
        // If enabled, disable then re-enable TVDB
        cy.wrap($checkbox).click();
        toggleTVDBSetting().then(({ response }) => {
          verifyTVDBResponse(response, false);
        });

        cy.wrap($checkbox).click();
        toggleTVDBSetting().then(({ response }) => {
          verifyTVDBResponse(response, true);
        });
      }
    });
  });

  it('should display "Tomorrow is Ours" show information correctly (1 season on TMDB >1 seasons on TVDB)', () => {
    cy.visit(ROUTES.tomorrowIsOursTvShow);
    cy.contains(SELECTORS.season2)
      .should('be.visible')
      .scrollIntoView()
      .click();
  });

  it('Should display "Monster" show information correctly (Not existing on TVDB)', () => {
    cy.visit(ROUTES.monsterTvShow);
    cy.intercept('/api/v1/tv/225634/season/1').as('season1');
    cy.contains(SELECTORS.season1)
      .should('be.visible')
      .scrollIntoView()
      .click();
    cy.wait('@season1');

    cy.contains('9 - Hang Men').should('be.visible');
  });
});
