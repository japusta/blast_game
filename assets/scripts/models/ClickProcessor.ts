import { BoardModel } from "./BoardModel";
import { BombBooster, TeleportBooster } from "./Boosters";
import { SuperHandlerFactory } from "./SuperHandlers";
import { TileModel } from "./TileModel";
import { ClickResult } from "./ClickResult";

export interface ClickOutcome {
  result: ClickResult;
  scoreDelta: number;
  consumeMove: boolean;
}

export class ClickProcessor {
  constructor(
    private board: BoardModel,
    private bomb: BombBooster,
    private teleport: TeleportBooster,
    private superFactory: SuperHandlerFactory
  ) {}

  private calcPoints(groupSize: number): number {
    return groupSize * 10 + (groupSize - 2) * 5;
  }

  process(
    row: number,
    col: number,
    useBooster: string | null = null,
    r2?: number,
    c2?: number
  ): ClickOutcome {
    let toRemove: TileModel[] = [];
    const tile = this.board.getTile(row, col);
    if (!tile) {
      return { result: { removed: [], moved: [], created: [], super: null }, scoreDelta: 0, consumeMove: false };
    }

    if (useBooster === "bomb") {
      toRemove = this.bomb.use(row, col, this.board);
      this.bomb.decrement();
    } else if (useBooster === "teleport" && r2 != null && c2 != null) {
      const isAdjacent =
        (row === r2 && Math.abs(col - c2) === 1) ||
        (col === c2 && Math.abs(row - r2) === 1);

      if (!isAdjacent) {
        return { result: { removed: [], moved: [], created: [], super: null }, scoreDelta: 0, consumeMove: false };
      }

      this.teleport.use(row, col, this.board, r2, c2);
      this.teleport.decrement();
      const moved = [
        { from: { r: row, c: col }, to: { r: r2, c: c2 } },
        { from: { r: r2, c: c2 }, to: { r: row, c: col } },
      ];
      return {
        result: { removed: [], moved, created: [], super: null },
        scoreDelta: 0,
        consumeMove: true,
      };
    } else {
      if (tile.isSuper) {
        toRemove = this.activateSuper(tile).filter((t) => t != null);
      } else {
        toRemove = this.board.findGroup(tile);
      }
    }

    if (toRemove.length <= 1) {
      return { result: { removed: [], moved: [], created: [], super: null }, scoreDelta: 0, consumeMove: false };
    }

    const removed = toRemove
      .filter((t): t is TileModel => t != null)
      .map((t) => ({ row: t.row, col: t.col }));
    const isSameColor = toRemove.every((t) => t.color === toRemove[0].color);
    const allowSuper = !useBooster && !tile.isSuper && isSameColor && toRemove.length >= this.board.superThreshold;

    const { moved, created, superTile } = this.board.removeGroup(toRemove, allowSuper);
    const scoreDelta = this.calcPoints(toRemove.length);
    const superInfo = superTile ? { row: superTile.row, col: superTile.col, type: superTile.superType } : null;

    return {
      result: { removed, moved, created, super: superInfo },
      scoreDelta,
      consumeMove: true,
    };
  }

  private activateSuper(tile: TileModel): TileModel[] {
    const handler = this.superFactory.getHandler(tile.superType);
    const tiles = handler.collect(this.board, tile);
    return Array.from(new Set(tiles));
  }
}