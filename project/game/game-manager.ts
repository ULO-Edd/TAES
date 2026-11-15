// game/game-manager.ts
import { BiscaGame } from './bisca';
import { Player } from './player';

export class GameManager {
  private game: BiscaGame | null = null;

  start(players: { id: string; name: string }[]) {
    const playerObjs = players.map(p => new Player(p.id, p.name));
    this.game = new BiscaGame(playerObjs);
  }

  play(playerId: string, card: any) {
    const player = this.game?.players.find(p => p.id === playerId);
    if (!player) throw new Error('Invalid player');
    try {
        this.game?.playCard(player, card);
    } catch (e) {
        throw new Error(`Invalid move: ${(e as Error).message}`);
    }
  }

  getState() {
    return {
      deckSize: this.game?.deck.length,
      table: this.game?.table,
      trump: this.game?.trumpCard,
      players: this.game?.players.map(p => ({
        id: p.id,
        points: p.points,
        hand: p.hand,
      })),
    };
  }
}

