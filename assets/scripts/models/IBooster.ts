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

  /**
   * Для некоторых бустеров (если появятся какие-то еще.например, телепорт вернет пустой массив) массив может быть пустым.
   */

  decrement(): void;

  readonly count: number;
}
