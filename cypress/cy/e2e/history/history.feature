Feature: View match history
    As a logged user
    I want to access history tab
    So that I can review my performance over time

    Background:
        Given I am logged in
        And I am on the "history" screen

    Scenario: View full match and game history
        When I see the list of all their matches and games
        Then I see the "1/12/2025" displayed
        And I see the "7m 00s" displayed
        And I see the "WIN" displayed
        And I see the "+115" displayed
        And I see the a trick-by-trick breakdown

    Scenario: Filter history by date range
        And I toggle the "filter" option
        And I select a start date and an end date
        And I click on the "Aplicar" date
        When I click the "apply_filters" button
        Then I see the "1/12/2025" displayed

    Scenario: Filter history by result
        And I toggle the "filter" option
        And I select "WIN" in the result filter
        When I click the "apply_filters" button
        Then I see the matches that Ive won

    Scenario: Filter history by achievements
        And I toggle the "filter" option
        And I select "Capote" in the achievements filter
        When I click the "apply_filters" button
        Then I see the matches that have "Capote"

    Scenario: Order history by date
        And I toggle the "filter" option
        And I select "Oldest" in the order filter
        When I click the "apply_filters" button
        Then I see the matches start with "1/12/2025"