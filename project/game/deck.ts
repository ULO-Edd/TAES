// game/deck.ts
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | 'Q' | 'J' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
}

export function createDeck(): Card[] {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', 'Q', 'J', 'K', 'A'];
    return suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));
}

export function shuffle(deck: Card[]): Card[] {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

