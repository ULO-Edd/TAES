import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import HistoryScreen from '../../screens/HistoryScreen';

When('I click on the "details" button', () => {
  HistoryScreen.clickFirstMatchDetails();
});

When('I {string} see the match details popup', (assertion) => {
  if (assertion == 'dont') assertion = false;
  HistoryScreen.assertMatchDetailsModal(assertion);
});

When('I see every game of the selected match', () => {
  HistoryScreen.assertEveryGameCard();
});

When('I see each game {string}', (info) => {
  HistoryScreen.assertGamesInfo(info);
});

When('I {string} a game', () => {
  HistoryScreen.clickGameHeader();
});

Then('I {string} see the list of turns for that game', (assertion) => {
  if (assertion == 'dont') assertion = false;
  HistoryScreen.assertListOfGameTurns(assertion);
});

When('I see each turn {string}', (info) => {
  HistoryScreen.assertTurnsInfo(info);
});

When('I expand a different game', () => {
  HistoryScreen.clickGameHeader(1);
});

Then('I see the turns of both expanded games', () => {
  HistoryScreen.assertListOfGameTurns(true);
  HistoryScreen.assertListOfGameTurns(true);
});
