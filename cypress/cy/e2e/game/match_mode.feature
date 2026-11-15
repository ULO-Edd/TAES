Feature: Match Structure
  As a logged user
  I want to be able to play matches
  So that I can earn extra coins

  Background:
    Given I am on the "dashboard" screen
    And I click the “match” button
    And I am on the “game” screen

  Scenario: Verify Match Mode
     Then I see the match score

  Scenario: Player Wins Match Normally
     When I win a total of “4” games
     Then I see the results screen
     And I see I won 20 coins
     And I see that my balance has increased

  Scenario: Player Wins Match by Bandeira
     When I win a total of “1” games
     And I have “120” points
     Then I see the match result screen
     And I see I won 40 coins
     And I see that my balance has increased

  Scenario: Player achieves a Capote 
     When I win a total of “1” games
     And I have a between “90” and “120” points
     Then I see the “Match Score” bo up by “2”

  Scenario: Player Wins Match by Bandeira
     When I win a total of “1” games
     And I have “120” points
     Then I see the match result screen
     And I see I won 40 coins
     And I see that my balance has increased