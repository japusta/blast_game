import { TileModel, TileColor, SuperType } from "./TileModel";

export class BoardModel {
  grid: TileModel[][] = [];
  rows: number;
  cols: number;
  superThreshold = 111;

  private allColors = [
    TileColor.Red,
    TileColor.Green,
    TileColor.Blue,
    TileColor.Yellow,
    TileColor.Purple
  ];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.initGrid();
  }

  private initGrid() {
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = this.createTile(r, c);
      }
    }
  }

  private createTile(r: number, c: number) {
    const color = this.allColors[Math.floor(Math.random() * this.allColors.length)];
    return new TileModel(r, c, color);
  }

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

      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr = t.row + dr, nc = t.col + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          const n = this.grid[nr][nc];
          if (n.color === target) stack.push(n);
        }
      }
    }
    return result;
  }

removeGroup(group: TileModel[]): {
  moved: { from: { r: number, c: number }, to: { r: number, c: number } }[],
  created: { row: number, col: number, color: number }[],
  superTile: TileModel | null
} {
  // Удаляем
  group.forEach(t => this.grid[t.row][t.col] = null!);

  let superTile: TileModel | null = null;
  if (group.length >= this.superThreshold) {
    const base = group[0];
    const superType = this.randomSuperType();
    superTile = new TileModel(base.row, base.col, base.color, superType);
    this.grid[base.row][base.col] = superTile;
  }

  const moved: { from: { r: number, c: number }, to: { r: number, c: number } }[] = [];

  // applyGravity с трекингом перемещений
  for (let c = 0; c < this.cols; c++) {
    let pointer = this.rows - 1;
    for (let r = this.rows - 1; r >= 0; r--) {
      const tile = this.grid[r][c];
      if (tile) {
        if (pointer !== r) {
          moved.push({ from: { r, c }, to: { r: pointer, c } });
          tile.row = pointer;
        }
        this.grid[pointer][c] = tile;
        pointer--;
      }
    }
    for (let r = pointer; r >= 0; r--) {
      this.grid[r][c] = null!;
    }
  }

  const created: { row: number, col: number, color: number }[] = [];

  // fillNewTiles с трекингом созданных
  for (let c = 0; c < this.cols; c++) {
    for (let r = 0; r < this.rows; r++) {
      if (!this.grid[r][c]) {
        const color = this.allColors[Math.floor(Math.random() * this.allColors.length)];
        const tile = new TileModel(r, c, color);
        this.grid[r][c] = tile;
        created.push({ row: r, col: c, color });
      }
    }
  }

  return { moved, created, superTile };
}



  private randomSuperType(): SuperType {
    const types = [SuperType.Row, SuperType.Column, SuperType.Radius, SuperType.Full];
    const weights = [0.3, 0.3, 0.25, 0.15];
    let sum = 0, r = Math.random();
    for (let i = 0; i < types.length; i++) {
      sum += weights[i];
      if (r <= sum) return types[i];
    }
    return SuperType.Row;
  }

  private applyGravity() {
    for (let c = 0; c < this.cols; c++) {
      let pointer = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c]) {
          this.grid[pointer][c] = this.grid[r][c];
          this.grid[pointer][c].row = pointer;
          pointer--;
        }
      }
      for (let r = pointer; r >= 0; r--) {
        this.grid[r][c] = null!;
      }
    }
  }

  private fillNewTiles() {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (!this.grid[r][c]) {
          this.grid[r][c] = this.createTile(r, c);
        }
      }
    }
  }

  hasMoves(): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.findGroup(this.grid[r][c]).length > 1) return true;
      }
    }
    return false;
  }

  shuffle() {
    const flat = this.grid.reduce((acc, row) => acc.concat(row), [] as TileModel[]);
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i].color, flat[j].color] = [flat[j].color, flat[i].color];
    }
  }
}
