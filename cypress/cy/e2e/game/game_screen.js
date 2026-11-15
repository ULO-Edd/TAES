import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import GameScreen from '../../screens/GameScreen';
import DashboardScreen from '../../screens/DashboardScreen';

before(() => {
  cy.fixture('valid_creds').then((data) => {
    credentials = data;
  });
});

When('I see my hand of 9 cards', () => {
  GameScreen.assertHand();
});

When('I see the face-up trump card', () => {
  GameScreen.assertTrumpCard();
});

When('I see the {string} score display {string}', (player, score) => {
  GameScreen[`assert${player.charAt(0).toUpperCase() + player.slice(1)}Score`](
    score
  );
});

When('I see my balance of {int} coins', (coins) => {
  cy.intercept(
    'GET',
    `${Cypress.env('SUPABASE_URL')}/rest/v1/profiles*`,
    (req) => {
      req.reply((res) => {
        res.body.coins = coins;
        res.send();
      });
    }
  ).as('patchedCoins');
  DashboardScreen.visit();
  DashboardScreen.assertCoinLabel(coins);
});

When('I see my balance is now {int} coins', (coins) => {
  DashboardScreen.assertCoinLabel(coins);
});

When('the entry fee for a match is {int} coins', (fee) => {
  DashboardScreen.assertMatchButtonEntryFee(fee);
});

Then('I see the "match" button is disabled', () => {
  DashboardScreen.assertMatchButtonDisabled();
});

Then('I see my {string} displayed', (info) => {
  GameScreen.assertMyInfo(info);
});

Then('I see the opponent {string} displayed', (info) => {
  GameScreen.assertOpponentInfo(info);
});
