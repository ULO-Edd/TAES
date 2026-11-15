Feature: Game Screen Setup
  As a player in the game screen,
  I want to see the complete game board when a new game begins,
  So that I can verify the game is set up correctly and I am ready to play.

  Scenario: Guest user starts a practice game
    Given I am on the "dashboard" screen
    When I click the "practice" button
    Then I am on the "game" screen
    And I see my hand of 9 cards
    And I see the face-up trump card
    And I see the "opponent" score display "0"
    And I see the "player" score display "0"

  Scenario: Registered user starts a new match with sufficient coins
    Given I am logged in
    And I am on the "dashboard" screen
    And I see my balance of 100 coins
    And the entry fee for a match is 10 coins
    When I click the "match" button
    Then I see my balance is now 90 coins
    And I am on the "game" screen
    And I see my hand of 9 cards
    And I see the face-up trump card
    And I see the "opponent" score display "0"
    And I see the "player" score display "0"

  Scenario: Registered user fails to start a match (insufficient coins)
    Given I am logged in
    And I am on the "dashboard" screen
    And I see my balance of 5 coins
    When the entry fee for a match is 10 coins
    Then I see the "match" button is disabled

  Scenario: View my profile information during the game
    Given I am logged in
    And I am on the "game" screen
    Then I see my "avatar" displayed
    And I see my "username" displayed
    And I see my "coin balance" displayed

  Scenario: View opponent information during the game
    Given I am logged in
    And I am on the "game" screen
    Then I see the opponent "avatar" displayed
    And I see the opponent "username" displayed