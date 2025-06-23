import { TileModel, TileColor, SuperType } from "./TileModel";
import { IBoardModel } from "./IBoardModel";
import { ITileRandomizer, TileRandomizer } from "./TileRandomizer";

export class BoardModel implements IBoardModel {
  private _grid: TileModel[][] = [];
  private randomizer: ITileRandomizer;
  readonly rows: number;
  readonly cols: number;
  readonly superThreshold = 5;

  public get gridData(): TileModel[][] {
    return this._grid;
  }

  public get grid(): TileModel[][] {
    return this._grid;
  }

  public getRow(row: number): TileModel[] {
    return this._grid[row];
  }

  public getColumn(col: number): TileModel[] {
    return this._grid.map((r) => r[col]);
  }

  public getAllTiles(): TileModel[] {
    return this._grid.reduce((acc, row) => acc.concat(row), [] as TileModel[]);
  }

  public getTile(row: number, col: number): TileModel | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this._grid[row][col];
  }

  public getTilesInRadius(
    row: number,
    col: number,
    radius: number
  ): TileModel[] {
    const tiles: TileModel[] = [];
    for (let r = row - radius; r <= row + radius; r++) {
      for (let c = col - radius; c <= col + radius; c++) {
        const tile = this.getTile(r, c);
        if (tile) {
          tiles.push(tile);
        }
      }
    }
    return tiles;
  }

  public swapTiles(r1: number, c1: number, r2: number, c2: number): void {
    const t1 = this._grid[r1][c1];
    const t2 = this._grid[r2][c2];
    this._grid[r1][c1] = t2;
    this._grid[r2][c2] = t1;
    if (t1) {
      t1.row = r2;
      t1.col = c2;
    }
    if (t2) {
      t2.row = r1;
      t2.col = c1;
    }
  }

  private allColors = [
    TileColor.Red,
    TileColor.Green,
    TileColor.Blue,
    TileColor.Yellow,
    TileColor.Purple,
  ];

  constructor(
    rows: number,
    cols: number,
    randomizer: ITileRandomizer = new TileRandomizer()
  ) {
    this.rows = rows;
    this.cols = cols;
    this.randomizer = randomizer;
    this.initGrid();
  }

  private initGrid() {
    this._grid = [];
    for (let r = 0; r < this.rows; r++) {
      this._grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this._grid[r][c] = this.createTile(r, c);
      }
    }
  }

  // Генерация нового тайла с защитой от авто-групп
  private createTile(r: number, c: number): TileModel {
    const forbiddenColors = new Set<number>();
    // хапрет на три в ряд по горизонтали
    if (c >= 2) {
      const left1 = this._grid[r][c - 1];
      const left2 = this._grid[r][c - 2];
      if (left1 && left2 && left1.color === left2.color) {
        forbiddenColors.add(left1.color);
      }
    }
    // запрет на три в ряд по вертикали
    if (r >= 2) {
      const down1 = this._grid[r - 1][c];
      const down2 = this._grid[r - 2][c];
      if (down1 && down2 && down1.color === down2.color) {
        forbiddenColors.add(down1.color);
      }
    }
    const availableColors = this.allColors.filter(
      (col) => !forbiddenColors.has(col)
    );
    const color = this.randomizer.randomColor(availableColors);
    return new TileModel(r, c, color);
  }

  // для поиска по сторонам всей группы
  findGroup(start: TileModel): TileModel[] {
    if (!start) return [];
    const visited = new Set<string>();
    const result: TileModel[] = [];
    const stack = [start];
    const target = start.color;

    while (stack.length) {
      const t = stack.pop()!;
      const key = `${t.row},${t.col}`;
      if (visited.has(key)) continue;
      visited.add(key);
      result.push(t);

      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nr = t.row + dr,
          nc = t.col + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const n = this._grid[nr][nc];
          if (n && n.color === target && !visited.has(`${nr},${nc}`)) {
            stack.push(n);
          }
        }
      }
    }
    return result;
  }

  // удаляем группу делает падение и заполняет новые тайлы
  removeGroup(
    group: TileModel[],
    createSuper: boolean = true
  ): {
    moved: { from: { r: number; c: number }; to: { r: number; c: number } }[];
    created: { row: number; col: number; color: number }[];
    superTile: TileModel | null;
  } {
    this.removeTiles(group);

    let superTile: TileModel | null = null;
    if (createSuper && group.length >= this.superThreshold) {
      superTile = this.insertSuperTile(group[0]);
    }

    const moved = this.dropTiles();
    const created = this.fillEmpty();

    return { moved, created, superTile };
  }

  private removeTiles(group: TileModel[]) {
    for (const t of group) {
      this._grid[t.row][t.col] = null!;
    }
  }

  private insertSuperTile(base: TileModel): TileModel {
    const superType = this.randomSuperType();
    const superTile = new TileModel(base.row, base.col, base.color, superType);
    this._grid[base.row][base.col] = superTile;
    return superTile;
  }

  private dropTiles(): {
    from: { r: number; c: number };
    to: { r: number; c: number };
  }[] {
    const moved: {
      from: { r: number; c: number };
      to: { r: number; c: number };
    }[] = [];
    for (let c = 0; c < this.cols; c++) {
      let pointer = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const tile = this._grid[r][c];
        if (tile) {
          if (pointer !== r) {
            moved.push({ from: { r, c }, to: { r: pointer, c } });
          }
          this._grid[pointer][c] = tile;
          tile.row = pointer;
          tile.col = c;
          pointer--;
        }
      }
      for (let r = pointer; r >= 0; r--) {
        this._grid[r][c] = null!;
      }
    }
    return moved;
  }

  private fillEmpty(): { row: number; col: number; color: number }[] {
    const created: { row: number; col: number; color: number }[] = [];
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (!this._grid[r][c]) {
          const tile = this.createTile(r, c);
          this._grid[r][c] = tile;
          created.push({ row: r, col: c, color: tile.color });
        }
      }
    }
    return created;
  }

  private randomSuperType(): SuperType {
    return this.randomizer.randomSuperType();
  }

  public generateSuperType(): SuperType {
    return this.randomSuperType();
  }

  hasMoves(): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.findGroup(this._grid[r][c]).length > 1) return true;
      }
    }
    return false;
  }

  shuffle() {
    const flat = this._grid.reduce(
      (acc, row) => acc.concat(row),
      [] as TileModel[]
    );
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i].color, flat[j].color] = [flat[j].color, flat[i].color];
    }
    // Обновить row/col у всех
    for (let idx = 0; idx < flat.length; idx++) {
      const r = Math.floor(idx / this.cols);
      const c = idx % this.cols;
      flat[idx].row = r;
      flat[idx].col = c;
      this._grid[r][c] = flat[idx];
    }
  }
}
