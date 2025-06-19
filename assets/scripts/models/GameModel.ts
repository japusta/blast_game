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

    const tile = this.board.grid[row]?.[col];
    if (!tile) return { removed: [], moved: [], created: [], super: null };

    if (useBooster === "bomb") {
      toRemove = this.bomb.use(row, col, this.board);
      this.bomb.decrement();
    } else if (useBooster === "teleport" && r2 != null && c2 != null) {
      const isAdjacent =
        (row === r2 && Math.abs(col - c2) === 1) ||
        (col === c2 && Math.abs(row - r2) === 1);

      if (!isAdjacent) {
        return { removed: [], moved: [], created: [], super: null };
      }

      this.teleport.use(row, col, this.board, r2, c2);
      this.teleport.decrement();

      const moved = [
        { from: { r: row, c: col }, to: { r: r2, c: c2 } },
        { from: { r: r2, c: c2 }, to: { r: row, c: col } },
      ];
      this.movesLeft -= 1;
      return { removed: [], moved, created: [], super: null };
    } else {
      if (tile.isSuper) {
        toRemove = this.activateSuper(tile).filter((t) => t != null);
        //   this.board.grid[row][col] = null as any; // удаляем супертайл после активации
      } else {
        toRemove = this.board.findGroup(tile);

      }
    }
      console.log('GRID:', this.board.grid.map(row => row.map(t => t ? t.color : null)));

    console.log('FIND GROUP:', toRemove.map(t => [t.row, t.col, t.color]));

    if (toRemove.length <= 1) {
      return { removed: [], moved: [], created: [], super: null };
    }

    const removed = toRemove
      .filter((t): t is TileModel => t != null)
      .map((t) => ({ row: t.row, col: t.col }));
    const rows = this.board.rows;
    const cols = this.board.cols;
    const moved: ClickResult["moved"] = [];
    const created: ClickResult["created"] = [];

    // ——— Флаг супер-тайла
    let superTile: { row: number; col: number; type: SuperType } | null = null;
    // Проверка: все тайлы одного цвета?
    const isSameColor = toRemove.every((t) => t.color === toRemove[0].color);

    // Супертайл возможен только если:
    // - не использовался бустер
    // - не активировался супертайл
    // - все тайлы одного цвета
    let baseTile: TileModel | null =
      !useBooster && isSameColor && toRemove.length >= this.board.superThreshold
        ? toRemove[0]
        : null;

    // Удаляем все тайлы из группы
    for (const t of toRemove) {
      this.board.grid[t.row][t.col] = null as any;
    }
    console.log('GRID_AFTER_REMOVE:', this.board.grid.map(row => row.map(t => t ? t.color : null)));


    this.score += this.calcPoints(toRemove.length);
    this.movesLeft -= 1;

    // Падение и заполнение
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

    // Вставка супер-тайла
    if (baseTile) {
      const { row, col } = baseTile;
      const color = baseTile.color;
      const type = this.board["randomSuperType"]();
      const superModel = new TileModel(row, col, color, type);
      this.board.grid[row][col] = superModel;
      superTile = { row, col, type };
    }

    // Победа / перемешка / поражение
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
    // ВАЖНО: перед активацией удаляем супертайл из grid
    this.board.grid[row][col] = null as any;
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
