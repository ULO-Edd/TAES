Feature: Guest Access
  As an anonymous user
  I want to skip authentication
  So that I can access the app

  Background:
    Given I am on the "login" screen
    When I click the "guest" button

  Scenario: Successful login skip
    Then I see the "Welcome, Guest!" label in the user profile section
