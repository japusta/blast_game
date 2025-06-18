// assets/scripts/models/Boosters.ts

import { TileModel } from "./TileModel";
import { BoardModel } from "./BoardModel";

export interface IBooster {
  /**
   * Выполнить действие бустера:
   * - bomb: вернуть массив тайлов в радиусе
   * - teleport: поменять цвета и вернуть пустой массив
   */
  use(...args: any[]): TileModel[];

  /** Уменьшить количество оставшихся применений бустера */
  decrement(): void;

  /** Сколько применений бустера осталось */
  readonly count: number;
}

export class BombBooster implements IBooster {
  private _count: number;

  /**
   * @param radius радиус «взрыва» (сотношение Manhattan)
   * @param initialCount сколько раз можно использовать бомбу
   */
  constructor(
    private radius: number,
    initialCount: number = 3
  ) {
    this._count = initialCount;
  }

  public use(row: number, col: number, board: BoardModel): TileModel[] {
    if (this._count <= 0) return [];

    const group: TileModel[] = [];
    for (let r = row - this.radius; r <= row + this.radius; r++) {
      for (let c = col - this.radius; c <= col + this.radius; c++) {
        if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
          group.push(board.grid[r][c]);
        }
      }
    }
    return group;
  }

  public decrement(): void {
    if (this._count > 0) {
      this._count--;
    }
  }

  public get count(): number {
    return this._count;
  }
}

export class TeleportBooster implements IBooster {
  private _count: number;

  /**
   * @param initialCount сколько раз можно использовать телепорт
   */
  constructor(initialCount: number = 5) {
    this._count = initialCount;
  }

  public use(
    r1: number,
    c1: number,
    board: BoardModel,
    r2: number,
    c2: number
  ): TileModel[] {
    if (this._count <= 0) return [];

    const t1 = board.grid[r1][c1];
    const t2 = board.grid[r2][c2];
    [t1.color, t2.color] = [t2.color, t1.color];
    return [];
  }

  public decrement(): void {
    if (this._count > 0) {
      this._count--;
    }
  }

  public get count(): number {
    return this._count;
  }
}
