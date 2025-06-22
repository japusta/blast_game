import { IBoardModel } from "./IBoardModel";
import { TileModel } from "./TileModel";

export interface IBooster {
  /**
   
   * @param board игровое поле
   * @param row индекс строки первого тайла
   * @param col индекс колонки первого тайла
   * @param targetRow 
   * @param targetCol 
   */
  use(
    board: IBoardModel,
    row: number,
    col: number,
    targetRow?: number,
    targetCol?: number
  ): TileModel[];

 
  decrement(): void;

  readonly count: number;
}