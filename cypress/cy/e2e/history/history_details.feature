Feature: View game history
  As a logged user
  I want to review the games inside a match
  So that I can understand each game's details and turn-by-turn actions

  Background:
    Given I am logged in
    And I am on the "history" screen
    And I click on the "details" button
    And I "do" see the match details popup

  Scenario: View all games inside the match
    When I see every game of the selected match
    Then I see each game "date"
    And I see each game "duration"
    And I see each game "result"

  Scenario: Expand a game to view its turns
    When I "expand" a game
    Then I "do" see the list of turns for that game
    And I see each turn "description"
    And I see each turn "players card"
    And I see each turn "trick winner"
    And I see each turn "running score"

  Scenario: Collapse a game to hide its turns
    And I "expand" a game
    When I "collapse" a game
    Then I "dont" see the list of turns for that game

  Scenario: Expand a second game while another is open
    And I "expand" a game
    When I expand a different game
    Then I see the turns of both expanded games

  Scenario: Close the game history popup
    When I click the "close_games" button
    Then I "dont" see the match details popup