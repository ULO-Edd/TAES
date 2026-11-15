// game/player.ts
import { Card } from './deck';

export class Player {
  id: string;
  name: string;
  hand: Card[] = [];
  wonCards: Card[] = [];
  points: number = 0;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  playCard(card: Card): Card {
    const index = this.hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
    if (index === -1) throw new Error(`${this.name} does not have that card`);
    return this.hand.splice(index, 1)[0];
  }

  addCards(cards: Card[]) {
    this.hand.push(...cards);
  }

  addWonCards(cards: Card[]) {
    this.wonCards.push(...cards);
  }

  reset() {
    this.hand = [];
    this.wonCards = [];
    this.points = 0;
  }
}

