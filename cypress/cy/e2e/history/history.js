import { When, Then, Given } from '@badeball/cypress-cucumber-preprocessor';
import HistoryScreen from '../../screens/HistoryScreen';


When('I see the list of all their matches and games', () => {
  HistoryScreen.assertHistoryListVisible();
});

Then('I see the {string} displayed', (info) => {
  HistoryScreen.assertMatchHistoryInfo(info);
});

Then('I see the a trick-by-trick breakdown', () => {
});

When('I toggle the "filter" option', () => {
  HistoryScreen.openFilters();
})

When('I select a start date and an end date', () => {
  HistoryScreen.openDateRangeInput();
  HistoryScreen.selectDate('2025-10-29');
  HistoryScreen.selectDate('2025-11-1');
})

When('I click on the "Aplicar" date', () => {
  HistoryScreen.clickApplyDate();
});

When('Then I see matches and games within that date range displayed', () => {
  HistoryScreen.assertMatchHistoryInfo(info);
});

When('I select "WIN" in the result filter', () => {
  HistoryScreen.clickResultWinChip();
});

Then('I see the matches that Ive won', () => {
  HistoryScreen.assertMatchHistoryInfo('WIN');
});

When('I select "Capote" in the achievements filter', () => {
  HistoryScreen.clickCapoteChip();
});

Then('I see the matches that have "Capote"', () => {
  HistoryScreen.assertMatchHistoryInfo('Capote');
});

When('I select "Oldest" in the order filter', () => {
  HistoryScreen.clickOldestOrderChip();
});

Then('I see the matches start with {string}', (date) => {
  HistoryScreen.assertMatchHistoryInfo(date);
});