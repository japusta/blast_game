import { BoardModel } from "./BoardModel";
import { TileModel, SuperType } from "./TileModel";
import { ISuperHandler } from "./ISuperHandler";

export class RowHandler implements ISuperHandler {
  collect(board: BoardModel, tile: TileModel): TileModel[] {
    return board.getRow(tile.row);
  }
}

export class ColumnHandler implements ISuperHandler {
  collect(board: BoardModel, tile: TileModel): TileModel[] {
    return board.getColumn(tile.col);
  }
}

export class RadiusHandler implements ISuperHandler {
  constructor(private radius: number = 1) {}

  collect(board: BoardModel, tile: TileModel): TileModel[] {
    return board.getTilesInRadius(tile.row, tile.col, this.radius);
  }
}

export class FullHandler implements ISuperHandler {
  collect(board: BoardModel, tile: TileModel): TileModel[] {
    return board.getAllTiles();
  }
}

export class SuperHandlerFactory {
  constructor(private radius: number = 1) {}

  getHandler(type: SuperType): ISuperHandler {
    switch (type) {
      case SuperType.Row:
        return new RowHandler();
      case SuperType.Column:
        return new ColumnHandler();
      case SuperType.Radius:
        return new RadiusHandler(this.radius);
      case SuperType.Full:
        return new FullHandler();
      default:
        return new RowHandler();
    }
  }
}

