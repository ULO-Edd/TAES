Feature: User Dashboard
  As a registered user
  I want to access the dashboard
  So that I can see my avatar, username and coin balance

  Background:
    Given I am logged in

  Scenario: Successful display of user information on dashboard
    When I navigate to the dashboard page
    Then I see my avatar displayed in the header
    And I see "TestUser" displayed in the header
    And I see my balance of 100 coins
    And I see the logout button
