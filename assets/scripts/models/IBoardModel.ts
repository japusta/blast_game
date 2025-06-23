import { TileModel, SuperType } from "./TileModel";

export interface IBoardModel {
  readonly rows: number;
  readonly cols: number;
  readonly superThreshold: number;
  readonly gridData: TileModel[][];
  readonly grid: TileModel[][];
  getRow(row: number): TileModel[];
  getColumn(col: number): TileModel[];
  getAllTiles(): TileModel[];
  getTile(row: number, col: number): TileModel | null;
  getTilesInRadius(row: number, col: number, radius: number): TileModel[];
  swapTiles(r1: number, c1: number, r2: number, c2: number): void;
  findGroup(start: TileModel): TileModel[];
  removeGroup(
    group: TileModel[],
    createSuper?: boolean
  ): {
    moved: { from: { r: number; c: number }; to: { r: number; c: number } }[];
    created: { row: number; col: number; color: number }[];
    superTile: TileModel | null;
  };
  generateSuperType(): SuperType;
  hasMoves(): boolean;
  shuffle(): void;
}
