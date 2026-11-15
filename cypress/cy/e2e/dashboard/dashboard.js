import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import DashboardScreen from '../../screens/DashboardScreen';

beforeEach(() => {
  cy.fixture('valid_creds').then((data) => {
    credentials = data;
  });
});

When('I navigate to the dashboard page', () => {
  DashboardScreen.visit();
});

Then('I see my avatar displayed in the header', () => {
  DashboardScreen.assertProfilePicVisible();
});

Then('I see {string} displayed in the header', (username) => {
  DashboardScreen.assertLabel(username);
});

Then('I see my balance of {int} coins', (balance) => {
  cy.intercept(
    'GET',
    `${Cypress.env('SUPABASE_URL')}/rest/v1/profiles*`,
    (req) => {
      req.reply((res) => {
        res.body.coins = balance;
        res.send();
      });
    },
  ).as('patchedCoins');
  DashboardScreen.visit();
  DashboardScreen.assertCoinLabel(balance);
});

Then('I see the logout button', () => {
  DashboardScreen.assertLogout();
});

after(() => {
  //cy.task('restoreDb');
});
