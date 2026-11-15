import { When, Then } from '@badeball/cypress-cucumber-preprocessor';
import GameScreen from '../../screens/GameScreen';

let initialDeckCount = null;
let myCard = { number: null, suit: null };
let opponentCard = { number: null, suit: null };

When('I see both players have cards in hand', () => {
  GameScreen.assertHand();
  GameScreen.assertOpponentHand();
});

When('I click on one of my available cards', () => {
  GameScreen.clickPlayerCard();
});

Then('I see my selected card on the game table', () => {
  GameScreen.assertGameTableHasCards(1);
});

When('I see that my hand updated to {int} cards', (nCards) => {
  GameScreen.assertHand(nCards);
});

When('I see that the remaining cards in my hand are disabled', () => {
  GameScreen.assertHandDisabled();
});

Then("I see opponent's card on the game table", () => {
  GameScreen.assertGameTableHasCards(2);
  GameScreen.getPlayerPlayedCard().then((card) => {
    myCard = card;
  });
  GameScreen.getOpponentPlayedCard().then((card) => {
    opponentCard = card;
  });
});

When('I see the deck counter above 0', () => {
  return GameScreen.assertDeckCounterAboveZero().then((count) => {
    initialDeckCount = count;
  });
});

When('I see the deck counter has decreased', () => {
  GameScreen.assertDeckCounterDecreased(initialDeckCount);
});

When('I see if the opponent card is valid', () => {
  expect(opponentCard.suit).to.equal(myCard.suit);
});

When('we play until hands have 1 remaining card', () => {
  GameScreen.playUntilLastCard();
});

Then('I see the game points calculated', () => {
  GameScreen.assertOpponentScoreNotZero();
  GameScreen.assertPlayerScoreNotZero();
});

When('I see the result screen', () => {
  GameScreen.assertResultScreen();
});
