import { TileModel, TileColor, SuperType } from "./TileModel";

export class BoardModel {
  grid: TileModel[][] = [];
  rows: number;
  cols: number;
  superThreshold = 5;

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
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = this.createTile(r, c);
      }
    }
  }

  // Генерация нового тайла с защитой от авто-групп
  private createTile(r: number, c: number): TileModel {
    const forbiddenColors = new Set<number>();
    // Запрет на три в ряд по горизонтали
    if (c >= 2) {
      const left1 = this.grid[r][c - 1];
      const left2 = this.grid[r][c - 2];
      if (left1 && left2 && left1.color === left2.color) {
        forbiddenColors.add(left1.color);
      }
    }
    // Запрет на три в ряд по вертикали
    if (r >= 2) {
      const down1 = this.grid[r - 1][c];
      const down2 = this.grid[r - 2][c];
      if (down1 && down2 && down1.color === down2.color) {
        forbiddenColors.add(down1.color);
      }
    }
    const availableColors = this.allColors.filter(col => !forbiddenColors.has(col));
    const color = availableColors[Math.floor(Math.random() * availableColors.length)];
    return new TileModel(r, c, color);
  }

  // Flood-fill по сторонам для поиска всей группы
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
          if (n && n.color === target && !visited.has(`${nr},${nc}`)) {
            stack.push(n);
          }
        }
      }
    }
    return result;
  }

  // Удаляет группу, делает падение и заполняет новые тайлы
  removeGroup(group: TileModel[]): {
    moved: { from: { r: number, c: number }, to: { r: number, c: number } }[],
    created: { row: number, col: number, color: number }[],
    superTile: TileModel | null
  } {
    // Удаляем группу
    for (const t of group) {
      this.grid[t.row][t.col] = null!;
    }

    let superTile: TileModel | null = null;
    // Если нужна вставка супертайла
    if (group.length >= this.superThreshold) {
      // Берём первый тайл группы как базу
      const base = group[0];
      const superType = this.randomSuperType();
      superTile = new TileModel(base.row, base.col, base.color, superType);
      this.grid[base.row][base.col] = superTile;
    }

    const moved: { from: { r: number, c: number }, to: { r: number, c: number } }[] = [];

    // ПАДЕНИЕ — всегда сверху вниз!
    for (let c = 0; c < this.cols; c++) {
      let pointer = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const tile = this.grid[r][c];
        if (tile) {
          if (pointer !== r) {
            moved.push({ from: { r, c }, to: { r: pointer, c } });
          }
          this.grid[pointer][c] = tile;
          tile.row = pointer;
          tile.col = c;
          pointer--;
        }
      }
      // Очищаем всё выше pointer
      for (let r = pointer; r >= 0; r--) {
        this.grid[r][c] = null!;
      }
    }

    const created: { row: number, col: number, color: number }[] = [];
    // ЗАПОЛНЯЕМ пустоты
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (!this.grid[r][c]) {
          const tile = this.createTile(r, c);
          this.grid[r][c] = tile;
          created.push({ row: r, col: c, color: tile.color });
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
    // Обновить row/col у всех!
    for (let idx = 0; idx < flat.length; idx++) {
      const r = Math.floor(idx / this.cols);
      const c = idx % this.cols;
      flat[idx].row = r;
      flat[idx].col = c;
      this.grid[r][c] = flat[idx];
    }
  }
}
