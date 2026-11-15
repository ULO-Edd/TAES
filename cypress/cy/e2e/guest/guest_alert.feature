Feature: Guest Access
    As a guest user
    I want to understand that I can only play practice matches
    So I know the limitations of practice mode

    Background:
        Given I am on the "login" screen
        When I click the "guest" button

    Scenario: Assert restricted features alert
        Then I see a message "Login to access Match Mode and earn coins!"

    Scenario Outline:  Guest User sees a warning when accessing different tabs
        When I click the "<tab>" tab
        Then I see a message saying to login

        Examples:
            | tab           |
            | history       |
            | customization |