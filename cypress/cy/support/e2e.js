/// <reference types="cypress" />

import './commands';

Cypress.on('uncaught:exception', (err, runnable) => {
  console.log(err);
  return false;
});

Cypress.Keyboard.defaults({
  keystrokeDelay: 0,
});

before(() => {
  cy.setColorCucumberSteps();
  /* cy.task('backupDb').then(() => {
  }); */
});
