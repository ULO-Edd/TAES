const CUSTOMIZATION_SCREEN_TITLE = '[data-testid="customization_title"]';
const EQUIPPED_BUTTONS = '[data-testid*="equipped_button"]';
const EQUIP_BUTTONS = '[data-testid*="equip_button"]';
const BUY_BUTTONS = '[data-testid*="buy_button"]';
const USER_COINS = '[data-testid="user_coins"]';

export default class CustomizationScreen {
  static visit() {
    cy.visit('/customization');
    this.assertUrl();
  }

  static assertUrl() {
    cy.url().should('include', '/customization');
  }

  static assertCoins() {
    cy.get(USER_COINS)
      .invoke('text')
      .then((text) => {
        const num = parseFloat(text.replace(/[^0-9.]/g, ''));
        cy.get(BUY_BUTTONS).each(($el) => {
          cy.get($el).invoke('text').then((buyText) => {
            const buyNum = parseFloat(buyText.replace(/[^0-9.]/g, ''));
            expect(num).to.be.greaterThan(buyNum);
          });
        });
      });
  }

  static assertBuyButtons() {
    cy.get(BUY_BUTTONS).should('have.length.greaterThan', 0);
  }

  static assertEquipButtons() {
    cy.get(EQUIP_BUTTONS).should('have.length.greaterThan', 0);
  }

  static clickBuyButton(val) {
    cy.get(BUY_BUTTONS).filter((_, el) => el.innerText.includes(val)).first().click();
  }

  static clickEquipAsset(asset) {
    cy.get(`[data-testid=view_${asset}]`).find(BUY_BUTTONS).first().click();
  }

  static assertEquippedButtons() {
    cy.get(EQUIPPED_BUTTONS).should('have.length.greaterThan', 0);
  }
}
