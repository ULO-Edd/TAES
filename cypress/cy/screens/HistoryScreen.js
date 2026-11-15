const HISTORY_LIST = 'div[data-testid="history_list"]';
const FILTER_TOGGLE = 'div[data-testid="filters_toggle"]';
const DATA_RANGE_INPUT = 'div[data-testid="date_range_input"]';
const DATE_PICKER_DATE = (date) => `button[data-testid*="${date}"]`;
const RESULT_WIN_CHIP = 'div[data-testid="result_win_chip"]';
const CAPOTE_WIN_CHIP = 'div[data-testid="achievement_capote_chip"]';
const OLDEST_ORDER_CHIP = 'div[data-testid="order_oldest_chip"]';
const APPLY_DATE_BUTTON = 'div[data-testid*="dates-save"]';
const DETAILS_BUTTON = 'div[data-testid*="match_details"]';
const MATCH_GAMES_MODAL = 'div[data-testid="match_games_modal"]';
const DETAILS_GAME_CARD = 'div[data-testid*="game_card"]';
const DETAILS_GAME_HEADER = 'div[data-testid*="game_header"]';
const DETAILS_GAME_RESULT = 'div[data-testid*="game_result"]';
const DETAILS_GAME_TURNS = 'div[data-testid*="game_turns"]';
const DETAILS_GAME_TURN_HEADER = 'div[data-testid*="turn_header"]';
const DETAILS_GAME_TURN_GRID = 'div[data-testid*="turn_grid"]';
const DETAILS_GAME_TURN_TOTAL_SCORE = 'div[data-testid*="total_row"]';

export default class HistoryScreen {
  static visit() {
    cy.visit('/history');
    this.assertUrl();
  }

  static assertUrl() {
    cy.url().should('include', '/history');
  }

  static assertHistoryListVisible() {
    cy.get(HISTORY_LIST).should('be.visible');
  }

  static assertMatchHistoryInfo(info, i = 0) {
    cy.get(HISTORY_LIST).children().first().children().eq(i).within(() => {
      cy.contains(info).should('be.visible');
    });
  }

  static openFilters() {
    cy.get(FILTER_TOGGLE).click();
  }

  static openDateRangeInput() {
    cy.get(DATA_RANGE_INPUT).click();
  }

  static selectDate(date) {
    cy.get(DATE_PICKER_DATE(date)).first().click();
  }

  static clickResultWinChip() {
    cy.get(RESULT_WIN_CHIP).click();
  }

  static clickCapoteChip() {
    cy.get(CAPOTE_WIN_CHIP).click();
  }

  static clickOldestOrderChip() {
    cy.get(OLDEST_ORDER_CHIP).click();
  }

  static clickApplyDate() {
    cy.get(APPLY_DATE_BUTTON).first().click();
  }

  static clickFirstMatchDetails() {
    cy.get(DETAILS_BUTTON).first().click();
  }

  static assertMatchDetailsModal(isVisible = true) {
    cy.get(MATCH_GAMES_MODAL).should(isVisible ? 'be.visible' : 'not.exist');
  }

  static assertEveryGameCard() {
    cy.get(DETAILS_GAME_CARD)
      .should('have.length.at.least', 3);
  }

  static assertGamesInfo(info) {
    switch (info) {
      case 'date': return cy.get(DETAILS_GAME_HEADER).each(($el) => {
        cy.wrap($el)
          .children().first()
          .children().eq(1)
          .invoke('text')
          .should(
            'match',
            /^\d{1,2}\/\d{1,2}\/\d{4}, ([01]?\d|2[0-3]):[0-5]\d:[0-5]\d$/
          );
      });
      case 'duration': return cy.get(DETAILS_GAME_HEADER).each(($el) => {
        cy.wrap($el)
          .children().first()
          .children().eq(2)
          .invoke('text')
          .should('match', /^Duration: .+ turns$/);
      });
      case 'result': return cy.get(DETAILS_GAME_RESULT).each(($el) => {
        cy.wrap($el)
          .invoke('text')
          .should('match', /^(WIN|LOSS)$/);
      });
    }
  }

  static clickGameHeader(index = 0) {
    cy.get(DETAILS_GAME_HEADER).eq(index).click();
  }

  static assertListOfGameTurns(isVisible = true) {
    cy.get(DETAILS_GAME_TURNS)
      .should(isVisible ? 'be.visible' : 'not.exist');
  }

  static assertTurnsInfo(info) {
    switch (info) {
      case 'description': return cy.get(DETAILS_GAME_TURN_HEADER).each(($el) => {
        cy.wrap($el)
          .children().eq(0)
          .invoke('text')
          .should('match', /^Turn .+$/);
      });
      case 'players card': return cy.get(DETAILS_GAME_TURN_GRID).each(($el) => {
        cy.wrap($el)
          .children().eq(0)
          .invoke('text')
          .should('match', /^.+ card.+$/);
      });
      case 'trick winner': return cy.get(DETAILS_GAME_TURN_HEADER).each(($el) => {
        cy.wrap($el)
          .children().eq(1)
          .invoke('text')
          .should('match', /^Winner: .+$/);
      });
      case 'running score': return cy.get(DETAILS_GAME_TURN_TOTAL_SCORE).each(($el) => {
        cy.wrap($el)
          .invoke('text')
          .should('match', /^.+ total.+$/);
      });
    }
  }
}
