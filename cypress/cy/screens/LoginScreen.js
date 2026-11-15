const LOGIN_EMAIL = 'input[data-testid="username_input"]';
const LOGIN_PASSWORD = 'input[data-testid="password_input"]';

export default class LoginScreen {
  static visit() {
    cy.visit('/');
  }

  static typeEmail(email) {
    if (!email) return;
    cy.get(LOGIN_EMAIL).clear().type(email);
  }

  static typePassword(password) {
    if (!password) return;
    cy.get(LOGIN_PASSWORD).clear().type(password);
  }
}
