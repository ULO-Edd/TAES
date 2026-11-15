const SCORE_LIST = 'div[data-testid="global_leaderboard_list"]';

export default class ScoreboardScreen {
  static visit() {
    cy.visit('/scoreboard');
    this.assertUrl();
  }

  static assertUrl() {
    cy.url().should('include', '/scoreboard');
  }

  static selectTab(tabName) {
    cy.get(`[data-testid="${tabName}_tab"]`).click();
  }

  static assertRowVisible(rowTestId, title, value) {
    cy.get(`[data-testid="${rowTestId}_row"]`)
      .should('be.visible')
      .within(() => {
        cy.get(':nth-child(1)').should('contain.text', title);
        cy.get(':nth-child(2)').should('have.text', value);
      });
  }

  static assertInfiniteScroll() {
    cy.get(SCORE_LIST).find('[data-testid]').should('have.length', 10);
    cy.get(SCORE_LIST).scrollTo('bottom');
    cy.get(SCORE_LIST)
      .find('[data-testid]')
      .should('have.length.greaterThan', 10);
  }
}
