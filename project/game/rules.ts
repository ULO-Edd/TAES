// game/rules.ts
import { Card } from './deck';

const CARD_VALUES: Record<string, number> = {
  'A': 11,
  '7': 10,
  'K': 4,
  'J': 3,
  'Q': 2,
  '6': 0,
  '5': 0,
  '4': 0,
  '3': 0,
  '2': 0
};

// Return card strength for comparison
export function getCardValue(card: Card): number {
  return CARD_VALUES[card.rank] ?? 0;
}

// Compare two cards given the trump suit
export function compareCards(card1: Card, card2: Card, trump: string, leadingSuit: string): number {
  // If same suit: higher rank wins
  if (card1.suit === card2.suit) {
    return getCardValue(card1) > getCardValue(card2) ? 1 : -1;
  }
  // If card2 matches trump and card1 doesn't
  if (card2.suit === trump && card1.suit !== trump) return -1;
  // If card1 matches trump and card2 doesn't
  if (card1.suit === trump && card2.suit !== trump) return 1;
  // If neither matches trump, leading suit wins
  if (card1.suit === leadingSuit && card2.suit !== leadingSuit) return 1;
  if (card2.suit === leadingSuit && card1.suit !== leadingSuit) return -1;
  return 0;
}

// Calculate total points for a pile of cards
export function calculatePoints(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + getCardValue(c), 0);
}

