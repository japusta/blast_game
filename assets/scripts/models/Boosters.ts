import { TileModel } from "./TileModel";
import { IBoardModel } from "./IBoardModel";
import { IBooster } from "./IBooster";

export class BombBooster implements IBooster {
  private _count: number;

  /**
   * @param radius радиус взрыва
   * @param initialCount сколько раз можно использовать бомбу
   */
  constructor(private readonly radius: number, initialCount: number = 3) {
    this._count = initialCount;
  }

  public get blastRadius(): number {
    return this.radius;
  }

  public use(board: IBoardModel, row: number, col: number): TileModel[] {
    if (this._count <= 0) return [];

    return board.getTilesInRadius(row, col, this.radius);
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

  constructor(initialCount: number = 5) {
    this._count = initialCount;
  }

  /**
   * Перемещает два тайла местами. Возвращает пустой массив,
   * так как при телепортации удаление тайлов не происходит.
   */

  public use(
    board: IBoardModel,
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): TileModel[] {
    if (this._count <= 0) return [];

    const t1 = board.getTile(r1, c1);
    const t2 = board.getTile(r2, c2);
    if (!t1 || !t2) return [];

    board.swapTiles(r1, c1, r2, c2);

    return [];
  }

  public decrement(): void {
    if (this._count > 0) this._count--;
  }
  public get count(): number {
    return this._count;
  }
}
