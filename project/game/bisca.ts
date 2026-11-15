// game/bisca.ts
import { Card, createDeck, shuffle } from './deck';
import { Player } from './player';
import { compareCards, calculatePoints } from './rules';
import { UndoManager, GameSnapshot } from './undo-manager';

export class BiscaGame {
    deck: Card[] = [];
    players: Player[] = [];
    trumpCard: Card | null = null;
    table: { player: Player; card: Card }[] = [];
    currentTurnIndex: number = 0;
    private turnNumber: number = 0;
    private undoManager: UndoManager = new UndoManager();


    constructor(players: Player[]) {
        this.players = players;
        this.startNewGame();
    }

    startNewGame() {
        this.deck = shuffle(createDeck());
        this.trumpCard = this.deck[this.deck.length - 1];
        this.players.forEach(p => p.reset());
        this.turnNumber = 0;
        this.undoManager.clear();
        this.dealInitialHands();
    }

    dealInitialHands() {
        // Deal 3 cards to each player, 3 times (total 9 cards each)
        for (let round = 0; round < 3; round++) {
            this.players.forEach(p => {
                if (this.deck.length > 0) {
                    p.addCards(this.deck.splice(0, 3));
                }
            });
        }
    }

    get currentPlayer(): Player {
        return this.players[this.currentTurnIndex];
    }

    playCard(player: Player, card: Card) {
        if (player !== this.currentPlayer)
            throw new Error(`Not ${player.name}'s turn`);

        this.undoManager.captureState(
            this.deck,
            this.trumpCard,
            this.table,
            this.players,
            this.currentTurnIndex,
            this.turnNumber,
            player.id,
            card
        );

        const playedCard = player.playCard(card);
        this.table.push({ player, card: playedCard });
        this.nextTurn();
    }

    undoLastMove(): boolean {
        const record = this.undoManager.undo();
        if (!record) {
            return false;
        }

        this.restoreSnapshot(record.snapshot);
        return true;
    }

    private restoreSnapshot(snapshot: GameSnapshot): void {
        this.deck = [...snapshot.deckCards];

        this.trumpCard = snapshot.trumpCard ? { ...snapshot.trumpCard } : null;

        // Restore table
        this.table = snapshot.tableCards.map(t => {
            const player = this.players.find(p => p.id === t.player.id)!;
            return { player, card: { ...t.card } };
        });

        this.currentTurnIndex = snapshot.currentTurnIndex;

        snapshot.players.forEach(savedPlayer => {
            const player = this.players.find(p => p.id === savedPlayer.id);
            if (player) {
                // Clear existing arrays completely
                player.hand.length = 0;
                player.wonCards.length = 0;

                // Repopulate with deep copies
                savedPlayer.hand.forEach(card => player.hand.push({ ...card }));
                savedPlayer.wonCards.forEach(card => player.wonCards.push({ ...card }));

                // Restore points
                player.points = savedPlayer.points;
            }
        });
    }

    canUndo(): boolean {
        return this.undoManager.canUndo();
    }

    getRemainingUndos(): number {
        return this.undoManager.getRemainingUndos();
    }

    getMaxUndo(): number {
        return this.undoManager.getMaxUndosPerGame();
    }

    getUndoCost(): number {
        return this.undoManager.getUndoCost();
    }

    getUndoCount(): number {
        return this.undoManager.getUndoCount();
    }

    exportMatchHistory(): string {
        return this.undoManager.exportMatchHistory();
    }

    nextTurn() {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    }

    hasUndosRemaining(): boolean {
        return this.undoManager.hasUndosRemaining();
    }

    undoToLastPlayerAction(playerId: string): boolean {
        const record = this.undoManager.undoToLastPlayerAction(playerId);
        if (!record) {
            return false;
        }

        this.restoreSnapshot(record.snapshot);
        return true;
    }

    evaluateRound() {
        const leadSuit = this.table[0].card.suit;
        const winner = this.table.reduce((best, current) => {
            const result = compareCards(best.card, current.card, this.trumpCard!.suit, leadSuit);
            return result >= 0 ? best : current;
        });
        const wonCards = this.table.map(t => t.card);
        const points = calculatePoints(wonCards);
        winner.player.addWonCards(wonCards);
        winner.player.points += points;

        this.table = [];
        this.dealNextCard(winner.player);
        this.currentTurnIndex = this.players.indexOf(winner.player);
    }

    manualEvaluateRound() {
        if (this.table.length === this.players.length) {
            this.evaluateRound();
        }
    }

    dealNextCard(winner: Player) {
        if (this.deck.length === 0) return;

        const winnerIndex = this.players.indexOf(winner);
        if (this.deck.length > 0) {
            this.players[winnerIndex].addCards(this.deck.splice(0, 1));
        }

        for (let i = 1; i < this.players.length; i++) {
            const playerIndex = (winnerIndex + i) % this.players.length;
            if (this.deck.length > 0) {
                this.players[playerIndex].addCards(this.deck.splice(0, 1));
            }
        }
    }

    canUndoForPlayer(playerId: string): boolean {
        return this.undoManager.canUndoForPlayer(playerId);
    }

    isGameOver(): boolean {
        return this.players.every(p => p.hand.length === 0) && this.deck.length === 0;
    }

    getWinner(): Player | null {
        if (!this.isGameOver()) return null;
        return this.players.reduce((a, b) => a.points > b.points ? a : b);
    }
}
