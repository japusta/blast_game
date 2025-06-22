import { BoardModel } from "./BoardModel";
import { TileModel } from "./TileModel";

export interface ISuperHandler {
  collect(board: BoardModel, tile: TileModel): TileModel[];
}