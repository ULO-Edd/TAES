const PLAYER_HAND = 'div[data-testid="player-hand-scroll"]';
const OPPONENT_HAND = 'div[data-testid="opponent-hand-scroll"]';
const OPPONENT_SCORE = 'div[data-testid="opponent-points"]';
const MY_SCORE = 'div[data-testid="player-points"]';
const TRUMP_CARD = 'div[data-testid="trump-card"]';
const GAME_TABLE = 'div[data-testid="table-view"]';
const DECK_COUNTER = 'div[data-testid="deck-info"]';
const GAME_RESULT_MODAL = 'div[data-testid="game-result-modal"]';
const MY_COINS = '[data-testid="user_coins"]';
const MY_AVATAR = '[data-testid="user_image"]';
const MY_USERNAME = '[data-testid="user_username"]';
const OPPONENT_AVATAR = '[data-testid="bot_image"]';
const OPPONENT_USERNAME = '[data-testid="bot_username"]';

let chosenCard = { number: null, suit: null };

export default class GameScreen {
  static visit() {
    cy.visit('/game');
    this.assertUrl();
  }

  static assertUrl() {
    cy.url().should('include', '/game');
  }

  static assertHand(lenght = 9) {
    cy.get(PLAYER_HAND)
      .should('be.visible')
      .within(() => {
        cy.get('[data-testid]').should('have.length', lenght);
      });
  }

  static assertOpponentHand(lenght = 9) {
    cy.get(OPPONENT_HAND)
      .should('be.visible')
      .within(() => {
        cy.get('[data-testid]').should('have.length', lenght);
      });
  }

  static assertTrumpCard() {
    cy.get(TRUMP_CARD).should('be.visible');
  }

  static getTrumpCardSuit() {
    return cy.get(TRUMP_CARD).find('div').find('div').eq(1).invoke('text');
  }

  static assertOpponentScore(score) {
    cy.get(OPPONENT_SCORE).contains(score).should('be.visible');
  }

  static assertOpponentScoreNotZero() {
    cy.get(OPPONENT_SCORE).contains('0').should('not.exist');
  }

  static assertPlayerScore(score) {
    cy.get(MY_SCORE).contains(score).should('be.visible');
  }

  static assertPlayerScoreNotZero() {
    cy.get(MY_SCORE).contains('0').should('not.exist');
  }

  static clickPlayerCard(cardIndex = 0) {
    cy.get(PLAYER_HAND)
      .find('[data-testid]')
      .eq(cardIndex)
      .as('cardToPlay')
      .should('not.have.attr', 'aria-disabled');

    return cy
      .get('@cardToPlay')
      .then(($card) => {
        chosenCard.number = $card.find('div').eq(0).text();
        chosenCard.suit = $card.find('div').eq(1).text();
      })
      .click(0, 0, { force: true });
  }

  static assertGameTableHasCards(lenght) {
    cy.get(GAME_TABLE).children().should('have.length', lenght);
  }

  static getOpponentPlayedCard() {
    return cy
      .get(GAME_TABLE)
      .children()
      .eq(1)
      .then(($card) => {
        const number = $card.find('div').eq(1).text();
        const suit = $card.find('div').eq(2).text();
        console.log($card, number, suit);
        return { number, suit };
      });
  }

  static getPlayerPlayedCard() {
    return cy
      .get(GAME_TABLE)
      .children()
      .eq(0)
      .then(($card) => {
        const number = $card.find('div').eq(1).text();
        const suit = $card.find('div').eq(2).text();
        console.log($card, number, suit);
        return { number, suit };
      });
  }

  static assertHandDisabled() {
    cy.get(PLAYER_HAND)
      .find('[data-testid]')
      .each((card) => {
        cy.wrap(card).should('have.attr', 'aria-disabled', 'true');
      });
  }

  static assertDeckCounterAboveZero() {
    return cy
      .get(DECK_COUNTER)
      .find('div')
      .eq(1)
      .invoke('text')
      .then((text) => {
        const count = parseInt(text);
        expect(count).to.be.greaterThan(0);
        return count;
      });
  }

  static assertDeckCounterDecreased(prevCounter) {
    cy.get(DECK_COUNTER)
      .find('div')
      .eq(1)
      .then((div) => {
        const currentCount = parseInt(div.text());
        expect(currentCount).to.be.lessThan(prevCounter);
      });
  }

  static playUntilLastCard(count = undefined) {
    return cy
      .get(PLAYER_HAND)
      .find('[data-testid]')
      .its('length')
      .then((len) => {
        if (len <= 1) {
          return cy.wrap(len);
        }

        return this.clickPlayerCard()
          .wait(1000)
          .then(() =>
            cy
              .get(PLAYER_HAND)
              .find('[data-testid]')
              .its('length')
              .then((newLen) => this.playUntilLastCard(newLen))
          );
      });
  }

  static assertResultScreen() {
    cy.get(GAME_RESULT_MODAL).should('be.visible');
  }

  static assertMyInfo(info) {
    switch (info) {
      case 'username': return cy.get(MY_USERNAME).should('have.text', 'You');
      case 'avatar': return cy.get(MY_AVATAR).find('img').should('exist');
      case 'coin balance': return cy.get(MY_COINS).should('be.visible');
    }
  }

  static assertOpponentInfo(info) {
    switch (info) {
      case 'username': return cy.get(MY_USERNAME).should('have.text', 'Bot');
      case 'avatar': return cy.get(MY_AVATAR).find('img').should('exist');
    }
  }
}
