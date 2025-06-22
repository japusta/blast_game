import { BoardModel } from "./BoardModel";
import { TileModel } from "./TileModel";

export interface IBooster {
  /**
   * Perform booster action.
   * @param board The game board
   * @param row Row index of the first tile
   * @param col Column index of the first tile
   * @param targetRow Optional target row for boosters that need a second tile
   * @param targetCol Optional target column for boosters that need a second tile
   */
  use(
    board: BoardModel,
    row: number,
    col: number,
    targetRow?: number,
    targetCol?: number
  ): TileModel[];

  /** Decrease remaining uses */
  decrement(): void;

  /** Remaining uses */
  readonly count: number;
}