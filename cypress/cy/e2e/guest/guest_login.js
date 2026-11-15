import { Then } from '@badeball/cypress-cucumber-preprocessor';
import DashboardScreen from '../../screens/DashboardScreen';

Then('I see the {string} label in the user profile section', (title) => {
  DashboardScreen.assertLabel(title);
});
