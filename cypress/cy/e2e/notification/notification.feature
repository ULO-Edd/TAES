Feature: Notifications
  As a registered player,
  I want to receive system-level notifications,
  So that I am informed about importants events such as a new global leaderboard leader or newly available customizations.

  Background:
    Given I am logged in

  Scenario: User opens a notification about a new global leaderboard leader
    And I receive a notification about a new "leaderboard leader"
    When I tap the notification
    Then I enter the "global scoreboard" screen

  Scenario: User receives a notification about newly available customizations
    Then I receive a notification informing about the new available items

  Scenario: User opens a customization update notification
    And I receive a notification about a new "customization items"
    When I tap the notification
    Then I enter the "Customizations" screen

  Scenario: Notification cannot be loaded due to missing data
    And I receive a notification with missing or invalid data
    When I tap the notification
    Then I see an error message indicating the notification cannot be opened

  Scenario: User does not receive notifications because they are disabled
    And I have disabled notifications in the system settings
    Then I dont receive any notification