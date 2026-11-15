import { When } from '@badeball/cypress-cucumber-preprocessor';
import DashboardScreen from '../../screens/DashboardScreen';

When('I click the {string} tab', (tab) => {
  DashboardScreen.navigateToTab(tab);
});

When('I see a message saying to login', () => { cy.contains('Log in to'); });
