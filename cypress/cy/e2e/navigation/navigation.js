import { When } from '@badeball/cypress-cucumber-preprocessor';
import DashboardScreen from '../../screens/DashboardScreen';

When('I click the {string} {string}', (name, type) => {
  switch (type) {
    case 'tab':
      DashboardScreen.navigateToTab(name);
      break;
    case 'button':
      cy.get(`[data-testid="${name}_button"]`).click();
      break;
    default:
      throw new Error(`Type "${type}" is not recognized.`);
  }
});
