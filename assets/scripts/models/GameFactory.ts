import { GameModel } from "./GameModel";
import { BoardModel } from "./BoardModel";
import { BombBooster, TeleportBooster } from "./Boosters";
import { SuperHandlerFactory } from "./SuperHandlers";
import { ClickProcessor } from "./ClickProcessor";
import { ITileRandomizer, TileRandomizer } from "./TileRandomizer";
import { IBoardModel } from "./IBoardModel";
import { IBooster } from "./IBooster";
import { IClickProcessor } from "./IClickProcessor";

export class GameFactory {
  constructor(
    private boardFactory: (
      rows: number,
      cols: number,
      randomizer: ITileRandomizer
    ) => IBoardModel = (r, c, rand) => new BoardModel(r, c, rand),
    private bombFactory: () => IBooster = () => new BombBooster(1),
    private teleportFactory: () => IBooster = () => new TeleportBooster(),
    private processorFactory: (
      board: IBoardModel,
      bomb: IBooster,
      teleport: IBooster,
      sf: SuperHandlerFactory
    ) => IClickProcessor = (b, bo, te, sf) => new ClickProcessor(b, bo, te, sf),
    private randomizer: ITileRandomizer = new TileRandomizer()
  ) {}

  create(rows: number, cols: number, moves: number, target: number): GameModel {
    const board = this.boardFactory(rows, cols, this.randomizer);
    const bomb = this.bombFactory();
    const teleport = this.teleportFactory();
    const superFactory = new SuperHandlerFactory((bomb as BombBooster).blastRadius);
    const processor = this.processorFactory(board, bomb, teleport, superFactory);
    return new GameModel(board, moves, target, processor, bomb, teleport);
  }
}