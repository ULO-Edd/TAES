import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import NotificationScreen from '../../screens/NotificationScreen';

When('I receive a notification about a new {string}', (object) => {
  cy.log(object)
  NotificationScreen.assertNotificationList();
});

When('I tap the notification', () => {
  NotificationScreen.assertNot();
});

Then('I enter in the global scoreboard screen', () => {
  NotificationScreen.assertNotificationList();
});

When('I receive a notification informing about the new available items', (nCards) => {
  cy.wait(1500);
});

Then('I enter the {string} screen', (screen) => {
  cy.log(screen);
  NotificationScreen.assertNot();
  NotificationScreen.assertNotificationList();
});

When('I receive a notification with missing or invalid data', () => {
  cy.wait(500);
});

Then('I see an error message indicating the notification cannot be opened', () => {
  NotificationScreen.clearNotifications();
});

When('I have disabled notifications in the system settings', () => {
  NotificationScreen.clearNotifications();
  NotificationScreen.assertNot();
  NotificationScreen.assertNotificationList();
});

Then('I dont receive any notification', () => {
  NotificationScreen.assertNotificationList();
  NotificationScreen.assertNot();
});