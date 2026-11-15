// game/bot.ts
import { Card } from './deck';
import { Player } from './player';

export interface BotStrategy {
  selectCard(hand: Card[], trumpSuit: string, tableCards: Card[]): Card;
}

export class SimpleBot implements BotStrategy {
  selectCard(hand: Card[], trumpSuit: string, tableCards: Card[]): Card {

    let candidates: Card[] = [];

    if (tableCards.length > 0) {
      const leadSuit = tableCards[0].suit;
      const matchingSuitCards = hand.filter(card => card.suit === leadSuit);

      if (matchingSuitCards.length > 0) {
        candidates = matchingSuitCards;
      } else {
        candidates = hand;
      }
    } else {
      candidates = hand;
    }

    const nonTrumpCandidates = candidates.filter(card => card.suit !== trumpSuit);

    if (nonTrumpCandidates.length > 0) {
       return nonTrumpCandidates[Math.floor(Math.random() * nonTrumpCandidates.length)];
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}
// Placeholder for future smart bot
export class SmartBot implements BotStrategy {
  selectCard(hand: Card[], trumpSuit: string, tableCards: Card[]): Card {
    // TODO: Implement smart strategy later

    return SimpleBot.prototype.selectCard.call(this, hand, trumpSuit, tableCards);
  }
}
