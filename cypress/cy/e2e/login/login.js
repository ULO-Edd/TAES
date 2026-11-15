import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

import LoginScreen from '../../screens/LoginScreen';
import DashboardScreen from '../../screens/DashboardScreen';

let credentials;

before(() => {
    cy.fixture('valid_creds').then((data) => {
        credentials = data;
    });
});

When('I enter valid email and password', () => {
    LoginScreen.typeEmail(credentials.email);
    LoginScreen.typePassword(credentials.password);
});

Then(
    'I see the {string} label in the user profile section',
    (message) => {
        DashboardScreen.assertLabel(message);
    }
);

When('I enter an invalid {string} or {string}', (email, password) => {
    LoginScreen.typeEmail(email);
    LoginScreen.typePassword(password);
});

Then('I remain on the "login" screen', () => {
    cy.url().should('include', '/');
});

When('I leave the email and password fields empty', () => {
    LoginScreen.typeEmail('');
    LoginScreen.typePassword('');
});
