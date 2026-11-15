Feature: Gameplay
  As a user playing a game
  I want the bot to automatically play by the rules
  So that the game flows as it should

  Background:
    Given I am on the "game" screen
    And I see both players have cards in hand

   Scenario: Player selects a card to play
        When I click on one of my available cards
        Then I see my selected card on the game table
       And I see that my hand updated to 8 cards
       And I see that the remaining cards in my hand are disabled

    Scenario: Bot plays after my move
       When I click on one of my available cards
       Then I see opponent's card on the game table

    Scenario: Turn resolution after both players have played
       And I click on one of my available cards
       Then I see opponent's card on the game table
       Then I see a message "won the round!"

    Scenario: Drawing new cards after a completed turn 
       And I see the deck counter above 0
       And I click on one of my available cards
       And I see opponent's card on the game table
       When I see a message "won the round!"
       Then I see that my hand updated to 9 cards
       And I see the deck counter has decreased

    Scenario: Starting the next turn
       And I click on one of my available cards
       And I see opponent's card on the game table
       When I see a message "won the round!"
       Then I see a message "Your turn"

  Scenario: Bot must follow suit during the first round
     When I click on one of my available cards
     Then I see opponent's card on the game table
     #And I see if the opponent card is valid

  Scenario: End of the game after all cards are played
     And we play until hands have 1 remaining card
     When I click on one of my available cards
     Then I see the game points calculated
     And I see the result screen