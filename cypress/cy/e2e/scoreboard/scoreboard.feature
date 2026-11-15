Feature: Scoreboard Screen
  As a registered player,
  I want to view my personal bests and the global scoreboard,
  So that I can track my performance and compare it with other players.

  Background:
    Given I am logged in
    And I am on the "scoreboard" screen

  Scenario: Registered user views their personal bests
    When I select "Personal Bests" tab
    Then I see the number of matches played
    And I see the user number of wins
    And I see the user win rate
    And I see the user Capote and Bandeira results

  Scenario: Registered user views global rankings
    When I select "Global Rankings" tab
    Then I see the leaderboard for most matches won
    Then I see the leaderboard for most coins earned
    And I see the leaderboard for most achievements

  Scenario: User with no recorded matches views personal bests
    When I select "Personal Bests" tab
    Then I see zeros for all personal statistics

  @mockInfiniteScroll
  Scenario: Infinite scrolling in global rankings
    When I select "Global Rankings" tab
    And I scroll to the bottom of the leaderboard
    Then more entries are loaded dynamically
