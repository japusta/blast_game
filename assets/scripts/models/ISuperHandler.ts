import { IBoardModel } from "./IBoardModel";
import { TileModel } from "./TileModel";

export interface ISuperHandler {
  collect(board: IBoardModel, tile: TileModel): TileModel[];
}
