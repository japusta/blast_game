import { IBoardModel } from "./IBoardModel";
import { BoosterType } from "./BoosterType";
import { IBooster } from "./IBooster";
import { SuperHandlerFactory } from "./SuperHandlers";
import { TileModel, SuperType } from "./TileModel";
import { ClickResult } from "./ClickResult";
import { IClickProcessor } from "./IClickProcessor";
import { ClickOutcome } from "./ClickOutcome";

export class ClickProcessor implements IClickProcessor {
  constructor(
    private board: IBoardModel,
    private bomb: IBooster,
    private teleport: IBooster,
    private superFactory: SuperHandlerFactory
  ) {}

  private calcPoints(groupSize: number): number {
    return groupSize * 10 + (groupSize - 2) * 5;
  }

  process(
    row: number,
    col: number,
    useBooster: BoosterType | null = null,
    r2?: number,
    c2?: number
  ): ClickOutcome {
    let toRemove: TileModel[] = [];
    let triggerType: SuperType | null = null;

    const tile = this.board.getTile(row, col);
    if (!tile) {
      return {
        result: { removed: [], moved: [], created: [], super: null },
        scoreDelta: 0,
        consumeMove: false,
      };
    }

    if (useBooster === BoosterType.Teleport && r2 != null && c2 != null) {
      return this.handleTeleport(row, col, r2, c2);
    }

    if (useBooster === BoosterType.Bomb) {
      toRemove = this.handleBomb(row, col);
    } else {
      ({ tiles: toRemove, trigger: triggerType } = this.collectTiles(tile));
    }

    if (toRemove.length <= 1) {
      return {
        result: {
          removed: [],
          moved: [],
          created: [],
          super: null,
          triggerType,
        },
        scoreDelta: 0,
        consumeMove: false,
      };
    }

    const removed = toRemove
      .filter((t): t is TileModel => t != null)
      .map((t) => ({ row: t.row, col: t.col }));
    const isSameColor = toRemove.every((t) => t.color === toRemove[0].color);
    const allowSuper =
      !useBooster &&
      !tile.isSuper &&
      isSameColor &&
      toRemove.length >= this.board.superThreshold;

    const { moved, created, superTile } = this.board.removeGroup(
      toRemove,
      allowSuper
    );
    const scoreDelta = this.calcPoints(toRemove.length);
    const superInfo = superTile
      ? { row: superTile.row, col: superTile.col, type: superTile.superType }
      : null;

    return {
      result: { removed, moved, created, super: superInfo, triggerType },
      scoreDelta,
      consumeMove: true,
    };
  }

  private handleTeleport(
    row: number,
    col: number,
    r2: number,
    c2: number
  ): ClickOutcome {
    const isAdjacent =
      (row === r2 && Math.abs(col - c2) === 1) ||
      (col === c2 && Math.abs(row - r2) === 1);

    if (!isAdjacent) {
      return {
        result: { removed: [], moved: [], created: [], super: null },
        scoreDelta: 0,
        consumeMove: false,
      };
    }

    this.teleport.use(this.board, row, col, r2, c2);
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
  }

  private handleBomb(row: number, col: number): TileModel[] {
    const tiles = this.bomb.use(this.board, row, col);
    this.bomb.decrement();
    return tiles;
  }

  private collectTiles(tile: TileModel): {
    tiles: TileModel[];
    trigger: SuperType | null;
  } {
    if (tile.isSuper) {
      return {
        tiles: this.activateSuper(tile).filter((t) => t != null),
        trigger: tile.superType,
      };
    }
    return { tiles: this.board.findGroup(tile), trigger: null };
  }

  private activateSuper(tile: TileModel): TileModel[] {
    const handler = this.superFactory.getHandler(tile.superType);
    const tiles = handler.collect(this.board, tile);
    return Array.from(new Set(tiles));
  }
}
