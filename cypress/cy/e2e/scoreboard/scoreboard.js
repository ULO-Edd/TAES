import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import ScoreboardScreen from '../../screens/ScoreboardScreen';

beforeEach({ tags: 'not @mockInfiniteScroll' }, () => {
  cy.mockPersonalReq(42, 30, 71.4, 5, 15);
  cy.intercept(
    'GET',
    `${Cypress.env('SUPABASE_URL')}/rest/v1/leaderboard_matches_won*`,
  ).as('getMatchesWonLeaderboard');
  cy.intercept(
    'GET',
    `${Cypress.env('SUPABASE_URL')}/rest/v1/leaderboard_coins_earned*`,
  ).as('getCoinsEarnedLeaderboard');
  cy.intercept(
    'GET',
    `${Cypress.env('SUPABASE_URL')}/rest/v1/leaderboard_achievements*`,
  ).as('getAchievementsLeaderboard');
});

beforeEach({ tags: '@mockInfiiteScroll' }, () => {
  cy.mockGlobalReq(70, 100);
});

When('I select {string} tab', (tab) => {
  const tabName = tab.toLowerCase().replace(/\s+/g, '_');
  ScoreboardScreen.selectTab(tabName);
});

Then('I see the number of matches played', () => {
  ScoreboardScreen.assertRowVisible('matches_played', 'Matches Played', '42');
});

Then('I see the user number of wins', () => {
  ScoreboardScreen.assertRowVisible('wins', 'Wins', '30');
});

Then('I see the user win rate', () => {
  ScoreboardScreen.assertRowVisible('win_rate', 'Win Rate', '71.4%');
});

Then('I see the user Capote and Bandeira results', () => {
  ScoreboardScreen.assertRowVisible('capote', 'Capote Results', '5');
  ScoreboardScreen.assertRowVisible('bandeira', 'Bandeira Results', '15');
});

Then('I see the leaderboard for most matches won', () => {
  const endpoint = `${Cypress.env('SUPABASE_URL')}/rest/v1/leaderboard_matches_won*`;

  cy.wait('@getMatchesWonLeaderboard')
    .its('response.statusCode')
    .should('eq', 200);
});

Then('I see the leaderboard for most coins earned', () => {
  ScoreboardScreen.selectTab('coins_earned');

  cy.wait('@getCoinsEarnedLeaderboard')
    .its('response.statusCode')
    .should('eq', 200);
});

Then('I see the leaderboard for most achievements', () => {
  ScoreboardScreen.selectTab('achievements');
  cy.wait('@getAchievementsLeaderboard')
    .its('response.statusCode')
    .should('eq', 200);
});

Then('I see zeros for all personal statistics', () => {
  cy.reload();
  cy.mockPersonalReq(0, 0, 0, 0, 0);

  ScoreboardScreen.assertRowVisible('matches_played', 'Matches Played', '0');
  ScoreboardScreen.assertRowVisible('wins', 'Wins', '0');
  ScoreboardScreen.assertRowVisible('win_rate', 'Win Rate', '0%');
  ScoreboardScreen.assertRowVisible('capote', 'Capote Results', '0');
  ScoreboardScreen.assertRowVisible('bandeira', 'Bandeira Results', '0');
});

When('I scroll to the bottom of the leaderboard', () => {
  //ScoreboardScreen.assertInfiniteScroll();
});

Then('more entries are loaded dynamically', () => {
  // ScoreboardScreen.assertInfiniteScroll();
});
