import { BoardModel } from "./BoardModel";
import { BombBooster, TeleportBooster } from "./Boosters";
import { TileModel, SuperType } from "./TileModel";

export interface ClickResult {
  removed: { row: number; col: number }[];
  moved: { from: { r: number; c: number }; to: { r: number; c: number } }[];
  created: { row: number; col: number; color: number }[];
  super?: { row: number; col: number; type: SuperType } | null;
}

export class GameModel {
  board: BoardModel;
  score = 0;
  movesLeft: number;
  targetScore: number;
  shuffleCount = 0;
  maxShuffles = 3;

  bomb = new BombBooster(1);
  teleport = new TeleportBooster();

  constructor(rows: number, cols: number, moves: number, target: number) {
    this.board = new BoardModel(rows, cols);
    this.movesLeft = moves;
    this.targetScore = target;
  }

    public get bombCount(): number {
    return this.bomb.count;
  }

  public get teleportCount(): number {
    return this.teleport.count;
  }

  private calcPoints(groupSize: number): number {
    return groupSize * 10 + (groupSize - 2) * 5;
  }

  private randomColor(): number {
    // допустим, 5 цветов от 0 до 4
    return Math.floor(Math.random() * TileModel.ColorCount);
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

  let toRemove: TileModel[] = [];

  if (useBooster === "bomb") {
    toRemove = this.bomb.use(row, col, this.board);
    this.bomb.decrement();
  } else if (useBooster === "teleport" && r2 != null && c2 != null) {
    // Проверка соседних тайлов (только горизонталь или вертикаль)
    const isAdjacent =
      (row === r2 && Math.abs(col - c2) === 1) ||
      (col === c2 && Math.abs(row - r2) === 1);

    if (!isAdjacent) {
      // Запрет обмена, если не соседние
      return { removed: [], moved: [], created: [], super: null };
    }

    // Обмен, если соседние тайлы
    this.teleport.use(row, col, this.board, r2, c2);
    this.teleport.decrement();

    const moved = [
      { from: { r: row, c: col }, to: { r: r2, c: c2 } },
      { from: { r: r2, c: c2 }, to: { r: row, c: col } },
    ];
    this.movesLeft -= 1; // расход хода на обмен
    return { removed: [], moved, created: [], super: null };
  } else {
    const tile = this.board.grid[row][col];
    if (tile.isSuper) {
      toRemove = this.activateSuper(tile);
    } else {
      toRemove = this.board.findGroup(tile);
    }
  }

  if (toRemove.length <= 1) {
    return { removed: [], moved: [], created: [], super: null };
  }

  const removed = toRemove.map((t) => ({ row: t.row, col: t.col }));
  for (const t of toRemove) {
    this.board.grid[t.row][t.col] = null as any;
  }
  this.score += this.calcPoints(toRemove.length);
  this.movesLeft -= 1;

  const rows = this.board.rows;
  const cols = this.board.cols;
  const moved: ClickResult["moved"] = [];
  const created: ClickResult["created"] = [];

  for (let c = 0; c < cols; c++) {
    const stack: TileModel[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      const t = this.board.grid[r][c];
      if (t) stack.push(t);
    }
    let writeRow = rows - 1;
    for (const tile of stack) {
      const oldRow = tile.row;
      if (oldRow !== writeRow) {
        moved.push({ from: { r: oldRow, c }, to: { r: writeRow, c } });
        tile.row = writeRow;
      }
      this.board.grid[writeRow][c] = tile;
      writeRow--;
    }
    for (let r = writeRow; r >= 0; r--) {
      const color = this.randomColor();
      const tile = new TileModel(r, c, color);
      this.board.grid[r][c] = tile;
      created.push({ row: r, col: c, color });
    }
  }

  let superTile: { row: number; col: number; type: SuperType } | null = null;

  if (this.score >= this.targetScore) {
    console.log("Win");
  } else if (!this.board.hasMoves()) {
    if (this.shuffleCount < this.maxShuffles) {
      this.board.shuffle();
      this.shuffleCount++;
    } else {
      console.log("Lose");
    }
  }

  return { removed, moved, created, super: superTile };
}


  private activateSuper(tile: TileModel): TileModel[] {
    const { row, col, superType } = tile;
    switch (superType) {
      case SuperType.Row:
        return this.board.grid[row];
      case SuperType.Column:
        return this.board.grid.map((r) => r[col]);
      case SuperType.Radius:
        return this.bomb.use(row, col, this.board);
      case SuperType.Full:
        return ([] as TileModel[]).concat(...this.board.grid);
      default:
        return [];
    }
  }
}
