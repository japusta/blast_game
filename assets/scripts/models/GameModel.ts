import { IBoardModel } from "./IBoardModel";
import { IBooster } from "./IBooster";
import { ClickResult } from "./ClickResult";
import { IClickProcessor } from "./IClickProcessor";
import { BoosterType } from "./BoosterType";

export class GameModel {
  board: IBoardModel;
  score = 0;
  movesLeft: number;
  targetScore: number;
  shuffleCount = 0;
  maxShuffles = 3;

  private boosters: Map<BoosterType, IBooster>;
  private clickProcessor: IClickProcessor;

  constructor(
    board: IBoardModel,
    moves: number,
    target: number,
    clickProcessor: IClickProcessor,
    boosters: Map<BoosterType, IBooster>
  ) {
    this.board = board;
    this.movesLeft = moves;
    this.targetScore = target;
    this.clickProcessor = clickProcessor;
    this.boosters = boosters;
  }

  public get bomb(): IBooster | undefined {
    return this.boosters.get(BoosterType.Bomb);
  }

  public get teleport(): IBooster | undefined {
    return this.boosters.get(BoosterType.Teleport);
  }

  public get bombCount(): number {
    return this.bomb ? this.bomb.count : 0;
  }

  public get teleportCount(): number {
    return this.teleport ? this.teleport.count : 0;
  }

  public click(
    row: number,
    col: number,
    useBooster: BoosterType | null = null,
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