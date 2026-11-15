// game/match-manager.ts
import { BiscaGame } from './bisca';
import { Player } from './player';

export interface GameResult {
  winner: Player;
  loser: Player;
  winnerPoints: number;
  loserPoints: number;
  capote: boolean;  // Winner took all tricks
  bandeira: boolean; // Winner got 91+ points
}

export interface MatchState {
  playerGamesWon: number;
  botGamesWon: number;
  currentGame: BiscaGame | null;
  matchWinner: string | null;
  gamesPlayed: GameResult[];
  coinsEarned: number;
}

export class MatchManager {
  private playerGamesWon: number = 0;
  private botGamesWon: number = 0;
  private currentGame: BiscaGame | null = null;
  private players: Player[] = [];
  private gamesPlayed: GameResult[] = [];
  private readonly GAMES_TO_WIN = 4;
  private readonly BASE_COINS_PER_GAME = 10;
  private readonly CAPOTE_BONUS = 20;
  private readonly BANDEIRA_BONUS = 15;

  constructor() {}

  startNewMatch(playerIds: { id: string; name: string }[]) {
    this.playerGamesWon = 0;
    this.botGamesWon = 0;
    this.gamesPlayed = [];
    this.players = playerIds.map(p => new Player(p.id, p.name));
    this.startNewGame();
  }

  startNewGame() {
    this.currentGame = new BiscaGame(this.players);
  }

  getCurrentGame(): BiscaGame | null {
    return this.currentGame;
  }

  isGameOver(): boolean {
    return this.currentGame?.isGameOver() || false;
  }

  isMatchOver(): boolean {
    return this.playerGamesWon >= this.GAMES_TO_WIN || this.botGamesWon >= this.GAMES_TO_WIN;
  }

  getMatchWinner(): string | null {
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

    // Check for Capote (winner took all tricks)
    const capote = loserPoints === 0 && winner.wonCards.length === 40; // All 40 cards

    // Check for Bandeira (91+ points out of 120 total)
    const bandeira = winnerPoints >= 91;

    const result: GameResult = {
      winner,
      loser,
      winnerPoints,
      loserPoints,
      capote,
      bandeira
    };

    this.gamesPlayed.push(result);

    // Update game wins
    // Capote counts as 2 games, Bandeira counts as 2 games
    let gamesWon = 1;
    if (capote) gamesWon = 2;
    else if (bandeira) gamesWon = 2;

    if (winner.id === 'player') {
      this.playerGamesWon += gamesWon;
    } else {
      this.botGamesWon += gamesWon;
    }

    return result;
  }

  calculateCoins(): number {
    let totalCoins = 0;

    this.gamesPlayed.forEach(game => {
      // Base coins for winning
      totalCoins += this.BASE_COINS_PER_GAME;

      // Bonus for achievements
      if (game.capote && game.winner.id === 'player') {
        totalCoins += this.CAPOTE_BONUS;
      }
      if (game.bandeira && game.winner.id === 'player') {
        totalCoins += this.BANDEIRA_BONUS;
      }
    });

    return totalCoins;
  }

  getMatchState(): MatchState {
    return {
      playerGamesWon: this.playerGamesWon,
      botGamesWon: this.botGamesWon,
      currentGame: this.currentGame,
      matchWinner: this.getMatchWinner(),
      gamesPlayed: this.gamesPlayed,
      coinsEarned: this.calculateCoins()
    };
  }
}
