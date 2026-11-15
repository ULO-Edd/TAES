Feature: User Login
  As a registered user
  I want to log in to the app
  So that I can access all available features

  Background:
    Given I am on the "login" screen

  Scenario: Successful login with valid credentials
    When I enter valid email and password
    And I click the "login" button
    Then I see the "Welcome, TestUser!" label in the user profile section

  Scenario Outline: Unsuccessful login with invalid credentials
    When I enter an invalid "<email>" or "<password>"
    And I click the "login" button
    Then I see a message "<message>"
    And I remain on the "login" screen

    Examples:
      | email                | password     | message                                  |
      | test@test.com        | wrongpass    | Invalid credentials.                     |
      | f@gmail.com			 | wrongpass    | Invalid credentials.                     |
      | test@test.com        | testPassword | Invalid credentials.                     |
      |                      |              | Please enter both username and password. |
