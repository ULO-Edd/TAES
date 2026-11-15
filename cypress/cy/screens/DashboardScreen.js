const USER_LABEL = 'div[data-testid="username_label"]';
const SCOREBOARD_TAB = '[data-testid="scoreboard_nav_tab"]';
const CUSTOMIZATION_TAB = '[data-testid="customization_nav_tab"]';
const HISTORY_TAB = '[data-testid="history_nav_tab"]';
const COIN_LABEL = 'div[data-testid="coins_label"]';
const LOGOUT_BUTTON = 'div[data-testid="logout_button"]';
const MATCH_BUTTON = 'div[data-testid="match_button"]';

export default class DashboardScreen {
  static visit() {
    cy.visit('/(tabs)');
  }

  static assertProfilePicVisible() {
    cy.get('img.css-accessibilityImage-9pa8cd')
      .should('have.attr', 'src');
  }

  static assertLabel(val) {
    cy.get(USER_LABEL).contains(val).should('be.visible');
  }

  static assertTabNotVisible(tabName) {
    let tabSelector = '';

    if (tabName === 'scoreboard') {
      tabSelector = SCOREBOARD_TAB;
    } else if (tabName === 'history') {
      tabSelector = HISTORY_TAB;
    } else if (tabName === 'customization') {
      tabSelector = CUSTOMIZATION_TAB;
    } else {
      throw new Error(`Tab with name "${tabName}" is not recognized.`);
    }

    cy.get(tabSelector).should('not.exist');
  }

  static navigateToTab(tabName) {
    let tabSelector = '';

    if (tabName === 'scoreboard') {
      tabSelector = SCOREBOARD_TAB;
    } else if (tabName === 'history') {
      tabSelector = HISTORY_TAB;
    } else if (tabName === 'customization') {
      tabSelector = CUSTOMIZATION_TAB;
    } else {
      throw new Error(`Tab with name "${tabName}" is not recognized.`);
    }

    cy.get(tabSelector).last().click();
  }

  static assertCoinLabel(val) {
    cy.get(COIN_LABEL).contains(val).should('be.visible');
  }

  static assertLogout() {
    cy.get(LOGOUT_BUTTON).should('be.visible');
  }

  static assertMatchButtonEntryFee() {
    cy.get(MATCH_BUTTON)
      .should('be.visible')
      .within(() => {
        cy.get('div').contains('10 Coins').should('be.visible');
      });
  }

  static assertMatchButtonDisabled() {
    cy.get(MATCH_BUTTON).should('have.attr', 'aria-disabled', 'true');
  }
}
