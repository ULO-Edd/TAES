// game/game-mode-manager.ts
import { BiscaGame } from './bisca';
import { Player } from './player';

export type GameMode = 'practice' | 'match';

export interface GameResult {
    winner: Player;
    loser: Player;
    winnerPoints: number;
    loserPoints: number;
    capote: boolean;
    bandeira: boolean;
}

export interface GameModeState {
    mode: GameMode;
    playerGamesWon: number;
    botGamesWon: number;
    currentGame: BiscaGame | null;
    matchWinner: string | null;
    gamesPlayed: GameResult[];
    coinsEarned: number;
    entryFee: number;
}

export class GameModeManager {
    private mode: GameMode = 'practice';
    private playerGamesWon: number = 0;
    private botGamesWon: number = 0;
    private currentGame: BiscaGame | null = null;
    private players: Player[] = [];
    private gamesPlayed: GameResult[] = [];

    private readonly GAMES_TO_WIN = 4;
    private readonly MATCH_ENTRY_FEE = 10;
    private readonly BASE_COINS_PER_GAME = 10;
    private readonly CAPOTE_BONUS = 20;
    private readonly BANDEIRA_BONUS = 15;

    constructor() { }

    startNewGame(mode: GameMode, playerIds: { id: string; name: string }[]) {
        this.mode = mode;
        this.playerGamesWon = 0;
        this.botGamesWon = 0;
        this.gamesPlayed = [];
        this.players = playerIds.map(p => new Player(p.id, p.name));
        this.currentGame = new BiscaGame(this.players);
    }

    startNextGame() {
        if (this.players.length === 0) return;
        this.currentGame = new BiscaGame(this.players);
    }

    getCurrentGame(): BiscaGame | null {
        return this.currentGame;
    }

    getMode(): GameMode {
        return this.mode;
    }

    getEntryFee(): number {
        return this.mode === 'match' ? this.MATCH_ENTRY_FEE : 0;
    }

    isGameOver(): boolean {
        return this.currentGame?.isGameOver() || false;
    }

    isMatchOver(): boolean {
        if (this.mode === 'practice') {
            return this.isGameOver(); // Practice ends after 1 game
        }
        return this.playerGamesWon >= this.GAMES_TO_WIN || this.botGamesWon >= this.GAMES_TO_WIN;
    }

    getMatchWinner(): string | null {
        if (this.mode === 'practice') {
            if (!this.isGameOver()) return null;
            const winner = this.currentGame!.getWinner();
            return winner ? winner.id : null;
        }

        if (this.playerGamesWon >= this.GAMES_TO_WIN) return 'player';
        if (this.botGamesWon >= this.GAMES_TO_WIN) return 'bot';
        return null;
    }

    evaluateGameResult(): GameResult | null {
        if (!this.isGameOver()) return null;

        const winner = this.currentGame!.getWinner();
        if (!winner) return null;

        const loser = this.players.find(p => p.id !== winner.id)!;
        const winnerPoints = winner.points;
        const loserPoints = loser.points;

        // Check for Capote (winner took all tricks - opponent has 0 points)
        const capote = winnerPoints >= 91;

        // Check for Bandeira (winner won with >= 120 points)
        const bandeira = winnerPoints >= 120;

        const result: GameResult = {
            winner,
            loser,
            winnerPoints,
            loserPoints,
            capote: this.mode === 'match' ? capote : false, // Only count in match mode
            bandeira: this.mode === 'match' ? bandeira : false,
        };

        this.gamesPlayed.push(result);

        // Update game wins (only for match mode)
        if (this.mode === 'match') {
            let gamesWon = 1;
            if (capote) gamesWon = 2;

            if (bandeira) gamesWon = 4;

            if (winner.id === 'player') {
                this.playerGamesWon += gamesWon;
            } else {
                this.botGamesWon += gamesWon;
            }
        }

        return result;
    }

    calculateCoins(): number {
        if (this.mode === 'practice') return 0; // No coins in practice

        let totalCoins = 0;

        this.gamesPlayed.forEach(game => {
            if (game.winner.id === 'player') {
                // Base coins for winning
                totalCoins += this.BASE_COINS_PER_GAME;

                // Bonus for achievements
                if (game.capote) {
                    totalCoins += this.CAPOTE_BONUS;
                }
                if (game.bandeira) {
                    totalCoins += this.BANDEIRA_BONUS;
                }
            }
        });

        return totalCoins;
    }

    getGameModeState(): GameModeState {
        return {
            mode: this.mode,
            playerGamesWon: this.playerGamesWon,
            botGamesWon: this.botGamesWon,
            currentGame: this.currentGame,
            matchWinner: this.getMatchWinner(),
            gamesPlayed: this.gamesPlayed,
            coinsEarned: this.calculateCoins(),
            entryFee: this.getEntryFee(),
        };
    }
}
