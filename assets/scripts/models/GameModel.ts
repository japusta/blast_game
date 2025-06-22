import { BoardModel } from "./BoardModel";
import { BombBooster, TeleportBooster } from "./Boosters";
import { SuperHandlerFactory } from "./SuperHandlers";
import { ClickResult } from "./ClickResult";
import { ClickProcessor } from "./ClickProcessor";

export class GameModel {
  board: BoardModel;
  score = 0;
  movesLeft: number;
  targetScore: number;
  shuffleCount = 0;
  maxShuffles = 3;

  bomb = new BombBooster(1);
  teleport = new TeleportBooster();
  private superFactory: SuperHandlerFactory;
  private clickProcessor: ClickProcessor;

  constructor(rows: number, cols: number, moves: number, target: number) {
    this.board = new BoardModel(rows, cols);
    this.movesLeft = moves;
    this.targetScore = target;
    this.superFactory = new SuperHandlerFactory(this.bomb.blastRadius);
    this.clickProcessor = new ClickProcessor(
      this.board,
      this.bomb,
      this.teleport,
      this.superFactory
    );
  }

  public get bombCount(): number {
    return this.bomb.count;
  }

  public get teleportCount(): number {
    return this.teleport.count;
  }

  public click(
    row: number,
    col: number,
    useBooster: string | null = null,
    r2?: number,
    c2?: number
  ): ClickResult {
    if (this.movesLeft <= 0) {
      return { removed: [], moved: [], created: [], super: null };
    }

    const outcome = this.clickProcessor.process(row, col, useBooster, r2, c2);
    if (outcome.consumeMove) {
      this.movesLeft -= 1;
      this.score += outcome.scoreDelta;
    }

    if (this.score >= this.targetScore) {
      // handle win state
    } else if (!this.board.hasMoves()) {
      if (this.shuffleCount < this.maxShuffles) {
        this.board.shuffle();
        this.shuffleCount++;
      } else {
        // handle lose state
      }
    }

    return outcome.result;
  }

}
