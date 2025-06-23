import { IBoardModel } from "./IBoardModel";
import { IBooster } from "./IBooster";
import { BoosterType } from "./BoosterType";
import { ClickResult } from "./ClickResult";
import { IClickProcessor } from "./IClickProcessor";

export class GameModel {
  board: IBoardModel;
  score = 0;
  movesLeft: number;
  targetScore: number;
  shuffleCount = 0;
  maxShuffles = 3;
  outOfMoves = false;

  public readonly bomb: IBooster;
  public readonly teleport: IBooster;
  private clickProcessor: IClickProcessor;

  constructor(
    board: IBoardModel,
    moves: number,
    target: number,
    clickProcessor: IClickProcessor,
    bomb: IBooster,
    teleport: IBooster
  ) {
    this.board = board;
    this.movesLeft = moves;
    this.targetScore = target;
    this.clickProcessor = clickProcessor;
    this.bomb = bomb;
    this.teleport = teleport;
  }

  public get bombCount(): number {
    return this.bomb.count;
  }

  public get teleportCount(): number {
    return this.teleport.count;
  }

  public get shuffleLeft(): number {
    return Math.max(this.maxShuffles - this.shuffleCount, 0);
  }

  public canShuffle(): boolean {
    return this.shuffleLeft > 0;
  }

  public manualShuffle(): boolean {
    if (!this.canShuffle()) return false;
    this.board.shuffle();
    this.shuffleCount++;
    return true;
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
      // вин стейт
    } else if (!this.board.hasMoves()) {
      while (this.shuffleCount < this.maxShuffles && !this.board.hasMoves()) {
        this.board.shuffle();
        this.shuffleCount++;
      }
      if (!this.board.hasMoves()) {
        this.outOfMoves = true;
        // луз стейт
      }
    }

    return outcome.result;
  }
}
