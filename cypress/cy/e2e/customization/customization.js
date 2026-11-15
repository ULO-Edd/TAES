import { Before } from '@badeball/cypress-cucumber-preprocessor';
import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import CustomizationScreen from '../../screens/CustomizationScreen';
import DashboardScreen from '../../screens/DashboardScreen';

function owned(asset, values) {
  cy.intercept(
    'GET',
    `${Cypress.env('SUPABASE_URL')}/rest/v1/profiles*owned_${asset}*`,
    (req) => {
      req.reply((res) => {
        res.body.coins = 3000;
        if (asset == 'avatar') res.body[asset] = 4;
        if (asset == 'theme') res.body[`selected_${asset}`] = 0;
        res.body[`owned_${asset}s`] = values;
        res.send();
      });
    }
  ).as('ownedAssets');
}

Before({ tags: 'not @BuyAsset' }, () => {
  owned('theme', [0, 1]);
  owned('avatar', [4, 1]);
});

Before({ tags: '@BuyAsset' }, () => {
  owned('theme', [0]);
  owned('avatar', [4]);
});

let assetToUse;

When('I am able to {string} a new {string}', (action, asset) => {
  assetToUse = asset;
  CustomizationScreen.assertCoins();
  if (action == 'buy') CustomizationScreen.assertBuyButtons();
  if (action == 'equip') CustomizationScreen.assertEquipButtons();
});

When('I click on {string} coins button', (val) => {
  CustomizationScreen.clickBuyButton(val);
});

Then('I see that {string} has been bought', (asset) => {
  CustomizationScreen.assertEquipButtons(asset);
});

When('I click on "equip" button', () => {
  CustomizationScreen.clickEquipAsset(assetToUse + 's');
});

Then('I see that {string} equipped', (asset) => {
  CustomizationScreen.assertEquippedButtons(asset);
});

When('I click on the logout button', () => {
  cy.get('[data-testid="home_nav_tab"]').first().click({ force: true });
  cy.get('[data-testid="logout_button"]').click();
});

When('I log in', () => {
  cy.supabaseLogin(credentials.email, credentials.password);
  DashboardScreen.visit();
});

Then('I see the previously equipped {string}', () => {
  DashboardScreen.assertProfilePicVisible();
});
