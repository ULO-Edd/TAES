Feature: Customize user experience
  As a logged user
  I want to access customization tab
  So that I customize my experience

  Background:
    Given I am logged in
    And I am on the "customization" screen

  @BuyAsset
  Scenario Outline: Buy a new asset
    And I am able to "buy" a new "<asset>"
    When I click on "<value>" coins button
    Then I see that "<asset>" has been bought
    And I see that "<asset>" equipped

    Examples:
      | asset  | value |
      | deck   | 500   |
      | avatar | 250   |

  Scenario Outline: Equip a new asset
    And I am able to "equip" a new "<asset>"
    When I click on "equip" button
    Then I see that "<asset>" equipped

    Examples:
      | asset  |
      | deck   |
      | avatar |

  Scenario Outline: Customization between sessions
    And I am able to "equip" a new "<asset>"
    And I click on "equip" button
    And I see that "<asset>" equipped
    And I click on the logout button
    When I log in
    Then I see the previously equipped "<asset>"

    Examples:
      | asset  |
      | deck   |
      | avatar |