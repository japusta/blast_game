import { TileModel, TileColor, SuperType } from "./TileModel";

export class BoardModel {
  grid: TileModel[][] = [];
  rows: number;
  cols: number;
  superThreshold = 5;

  // Явный список цветов, чтобы не использовать Object.values
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

  /**
   * Удаляет группу, создаёт супер-тайл если нужно,
   * делает гравитацию и заполнение сверху.
   * Возвращает созданный супер-тайл или null.
   */
  removeGroup(group: TileModel[]): TileModel | null {
    // Удаляем
    group.forEach(t => this.grid[t.row][t.col] = null!);

    // Создаём супер-тайл, если группа большая
    let superTile: TileModel | null = null;
    if (group.length >= this.superThreshold) {
      const base = group[0];
      const st = new TileModel(base.row, base.col, base.color, true);
      // выбираем тип циклически
      const types = [SuperType.Row, SuperType.Column, SuperType.Radius, SuperType.Full];
      st.superType = types[group.length % types.length];
      this.grid[base.row][base.col] = st;
      superTile = st;
    }

    this.applyGravity();
    this.fillNewTiles();
    return superTile;
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
    // вместо flat() – через reduce+concat
    const flat = this.grid.reduce((acc, row) => acc.concat(row), [] as TileModel[]);
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i].color, flat[j].color] = [flat[j].color, flat[i].color];
    }
    // цвета поменялись «по ссылкам»
  }
}
