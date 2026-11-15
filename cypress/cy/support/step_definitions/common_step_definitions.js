import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import LoginScreen from '../../screens/LoginScreen';
import DashboardScreen from '../../screens/DashboardScreen';
import HistoryScreen from '../../screens/HistoryScreen';
import ScoreboardScreen from '../../screens/ScoreboardScreen';
import CustomizationScreen from '../../screens/CustomizationScreen';
import GameScreen from '../../screens/GameScreen';

beforeEach(() => {
  cy.fixture('valid_creds').then((data) => {
    credentials = data;
  });
});

Given('I am on the {string} screen', (screen) => {
  switch (screen) {
    case 'login':
      return LoginScreen.visit();
    case 'dashboard':
      return DashboardScreen.visit();
    case 'history':
      return HistoryScreen.visit();
    case 'scoreboard':
      return ScoreboardScreen.visit();
    case 'customization':
      return CustomizationScreen.visit();
    case 'game':
      return GameScreen.visit();
    default:
      throw new Error(`Screen with name "${screen}" is not recognized.`);
  }
});

Given('I am logged in', () => {
  cy.supabaseLogin(credentials.email, credentials.password);
});

When('I click the {string} button', (buttonToClick) => {
  cy.get(`[data-testid="${buttonToClick}_button"]`).click();
});

When('I see a message {string}', (message) => {
  cy.contains(message).should('be.visible');
});

Then('I see the {string} page', (title) => {
  switch (title) {
    case 'history':
      return HistoryScreen.assertUrl();
    case 'scoreboard':
      return ScoreboardScreen.assertUrl();
    case 'customization':
      return CustomizationScreen.assertUrl();
    case 'practice':
      return GameScreen.assertUrl();
    default:
      throw new Error(`Page with title "${title}" is not recognized.`);
  }
});
