export interface IBooster {
  /**
   * Perform booster action.
   * - bomb: return affected tiles
   * - teleport: swap tiles and return empty array
   */
  use(...args: any[]): import("./TileModel").TileModel[];

  /** Decrease remaining uses */
  decrement(): void;

  /** Remaining uses */
  readonly count: number;
}
