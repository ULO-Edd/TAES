// game/undo-manager.ts
import { Card } from './deck';
import { Player } from './player';

export interface GameSnapshot {
    // Core game state
    deckCards: Card[];
    trumpCard: Card | null;
    tableCards: { player: { id: string; name: string }; card: Card }[];
    currentTurnIndex: number;

    // Player states
    players: {
        id: string;
        name: string;
        hand: Card[];
        wonCards: Card[];
        points: number;
    }[];

    // Metadata
    timestamp: number;
    turnNumber: number;
}

export interface UndoRecord {
    snapshot: GameSnapshot;
    action: {
        type: 'CARD_PLAYED';
        playerId: string;
        card: Card;
        turnNumber: number;
    };
}

export class UndoManager {
    private history: UndoRecord[] = [];
    private maxHistorySize: number = 50; // Prevent memory issues
    private undoCount: number = 0;
    private readonly MAX_UNDOS_PER_GAME = 5;
    private readonly UNDO_COST = 10; // Coins per undo

    constructor() { }

    /**
     * Captures current game state before a card is played
     */
    captureState(
        deck: Card[],
        trumpCard: Card | null,
        table: { player: Player; card: Card }[],
        players: Player[],
        currentTurnIndex: number,
        turnNumber: number,
        playerId: string,
        card: Card
    ): void {
        const snapshot: GameSnapshot = {
            deckCards: [...deck],
            trumpCard: trumpCard ? { ...trumpCard } : null,
            tableCards: table.map(t => ({
                player: { id: t.player.id, name: t.player.name },
                card: { ...t.card }
            })),
            currentTurnIndex,
            players: players.map(p => ({
                id: p.id,
                name: p.name,
                hand: [...p.hand],
                wonCards: [...p.wonCards],
                points: p.points
            })),
            timestamp: Date.now(),
            turnNumber
        };

        const record: UndoRecord = {
            snapshot,
            action: {
                type: 'CARD_PLAYED',
                playerId,
                card: { ...card },
                turnNumber
            }
        };

        this.history.push(record);

        // Limit history size to prevent memory issues
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
   * Undo back to the last player action
   * Returns the snapshot to restore, or null if no player history
   */
    undoToLastPlayerAction(targetPlayerId: string): { snapshot: GameSnapshot; undoCount: number } | null {
        if (this.history.length === 0) {
            return null;
        }

        let movesUndone = 0;
        let targetSnapshot: GameSnapshot | null = null;

        // Pop moves until we find the target player's last action
        while (this.history.length > 0) {
            const record = this.history.pop()!;
            movesUndone++;

            // Found the player's action
            if (record.action.playerId === targetPlayerId) {
                targetSnapshot = record.snapshot;
                break;
            }
        }

        if (!targetSnapshot) {
            return null;
        }

        this.undoCount++;
        return { snapshot: targetSnapshot, undoCount: movesUndone };
    }

    /**
     * Check if undo is available for a specific player
     */
    canUndoForPlayer(playerId: string): boolean {
        if (this.history.length === 0) return false;

        // Check if there's any action by this player in the history
        return this.history.some(record => record.action.playerId === playerId);
    }

    /**
     * Returns the last state or null if no history
     */
    undo(): UndoRecord | null {
        if (this.history.length === 0) {
            return null;
        }

        const record = this.history.pop()!;
        this.undoCount++;
        return record;
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.history.length > 0 && this.undoCount < this.MAX_UNDOS_PER_GAME;
    }

    hasUndosRemaining(): boolean {
        return this.undoCount < this.MAX_UNDOS_PER_GAME;
    }

    getRemainingUndos(): number {
        return this.MAX_UNDOS_PER_GAME - this.undoCount;
    }

    getMaxUndosPerGame(): number {
        return this.MAX_UNDOS_PER_GAME;
    }

    /**
     * Get the cost of undoing
     */
    getUndoCost(): number {
        return this.UNDO_COST;
    }

    /**
     * Get total undos used in current game
     */
    getUndoCount(): number {
        return this.undoCount;
    }

    /**
     * Clear history (called when starting new game)
     */
    clear(): void {
        this.history = [];
        this.undoCount = 0;
    }

    /**
     * Get current history size
     */
    getHistorySize(): number {
        return this.history.length;
    }

    /**
     * Get all records (useful for match replay feature)
     */
    getHistory(): UndoRecord[] {
        return [...this.history];
    }

    /**
     * Export history for match recording
     */
    exportMatchHistory(): string {
        return JSON.stringify({
            records: this.history,
            undoCount: this.undoCount,
            exportedAt: new Date().toISOString()
        });
    }

    /**
     * Import history from saved match
     */
    importMatchHistory(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);
            this.history = data.records || [];
            this.undoCount = data.undoCount || 0;
            return true;
        } catch (error) {
            console.error('Failed to import match history:', error);
            return false;
        }
    }
}
