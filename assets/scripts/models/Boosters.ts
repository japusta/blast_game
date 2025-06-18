import { TileModel } from "./TileModel";
import { BoardModel } from "./BoardModel";

export interface IBooster {
  use(...args: any[]): TileModel[];
}

export class BombBooster implements IBooster {
  constructor(private radius: number) {}

  use(row: number, col: number, board: BoardModel): TileModel[] {
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
}

export class TeleportBooster implements IBooster {
  use(r1: number, c1: number, board: BoardModel, r2: number, c2: number): TileModel[] {
    const t1 = board.grid[r1][c1];
    const t2 = board.grid[r2][c2];
    [t1.color, t2.color] = [t2.color, t1.color];
    return [];
  }
}
