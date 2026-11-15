Feature: User Navigation
  As a registered user in the dashboard
  I want to use a navbar
  So I can easily navigate to all main features

  Scenario Outline: Access different tabs
    Given I am logged in
    And I am on the "dashboard" screen
    When I click the "<tabName>" "<element>"
    Then I see the "<tabName>" page

    Examples:
      | tabName       | element |
      | scoreboard    | tab     |
      | history       | tab     |
      | customization | tab     |
      | practice      | button  |
