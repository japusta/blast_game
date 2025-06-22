import { GameModel } from "./GameModel";
import { BoardModel } from "./BoardModel";
import { BombBooster, TeleportBooster } from "./Boosters";
import { SuperHandlerFactory } from "./SuperHandlers";
import { ClickProcessor } from "./ClickProcessor";

export class GameFactory {
  create(rows: number, cols: number, moves: number, target: number): GameModel {
    const board = new BoardModel(rows, cols);
    const bomb = new BombBooster(1);
    const teleport = new TeleportBooster();
    const superFactory = new SuperHandlerFactory(bomb.blastRadius);
    const processor = new ClickProcessor(board, bomb, teleport, superFactory);
    return new GameModel(board, moves, target, processor, bomb, teleport);
  }
}
