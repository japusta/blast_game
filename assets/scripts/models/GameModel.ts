import { BoardModel } from "./BoardModel";
import { BombBooster, TeleportBooster } from "./Boosters";
import { TileModel, SuperType } from "./TileModel";

export interface ClickResult {
    removed:  { row: number, col: number }[];
    moved:    { from: { r: number, c: number }, to: { r: number, c: number } }[];
    created:  { row: number, col: number, color: number }[];
    super?:   { row: number, col: number, type: SuperType } | null;
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
        this.board      = new BoardModel(rows, cols);
        this.movesLeft  = moves;
        this.targetScore = target;
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
        // если нет ходов — сразу выходим
        if (this.movesLeft <= 0) {
            return { removed: [], moved: [], created: [], super: null };
        }

        // 1) Собираем группу для удаления
        let toRemove: TileModel[] = [];
        if (useBooster === 'bomb') {
            toRemove = this.bomb.use(row, col, this.board);
        }
        else if (useBooster === 'teleport' && r2 != null && c2 != null) {
            toRemove = this.teleport.use(row, col, this.board, r2, c2);
        }
        else {
            const tile = this.board.grid[row][col];
            if (tile.isSuper) {
                toRemove = this.activateSuper(tile);
            } else {
                toRemove = this.board.findGroup(tile);
            }
        }

        // если нечего удалять — выход
        if (toRemove.length <= 1) {
            return { removed: [], moved: [], created: [], super: null };
        }

        // 2) Удаляем и считаем очки
        const removed = toRemove.map(t => ({ row: t.row, col: t.col }));
        for (const t of toRemove) {
            this.board.grid[t.row][t.col] = null as any;
        }
        this.score     += this.calcPoints(toRemove.length);
        this.movesLeft -= 1;

        // 3) Обрабатываем падение существующих и появление новых
        const rows = this.board.rows;
        const cols = this.board.cols;
        const moved: ClickResult['moved']   = [];
        const created: ClickResult['created'] = [];

        for (let c = 0; c < cols; c++) {
            // собираем все тайлы в колонке снизу вверх
            const stack: TileModel[] = [];
            for (let r = rows - 1; r >= 0; r--) {
                const t = this.board.grid[r][c];
                if (t) stack.push(t);
            }
            // переписываем в grid и фиксируем moved
            let writeRow = rows - 1;
            for (const tile of stack) {
                const oldRow = tile.row;
                if (oldRow !== writeRow) {
                    moved.push({
                        from: { r: oldRow, c },
                        to:   { r: writeRow, c }
                    });
                    tile.row = writeRow;
                }
                this.board.grid[writeRow][c] = tile;
                writeRow--;
            }
            // сверху создаём недостающие
            for (let r = writeRow; r >= 0; r--) {
                const color = this.randomColor();
                const tile  = new TileModel(r, c, color);
                this.board.grid[r][c] = tile;
                created.push({ row: r, col: c, color });
            }
        }

        // 4) Перемешивания, win/lose
        let superTile: { row: number, col: number, type: SuperType } | null = null;
        // (если наш BoardModel.removeGroup устанавливает супер-тайлы, можно захватить тут)
        // superTile = this.board.removeGroupMarker();

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
            case SuperType.Row:     return this.board.grid[row];
            case SuperType.Column:  return this.board.grid.map(r => r[col]);
            case SuperType.Radius:  return this.bomb.use(row, col, this.board);
            case SuperType.Full:    return ([] as TileModel[]).concat(...this.board.grid);
            default:                return [];
        }
    }
}
