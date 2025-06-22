import { TileColor, SuperType } from "./TileModel";

export interface ITileRandomizer {
  randomColor(colors: TileColor[]): TileColor;
  randomSuperType(): SuperType;
}

export class TileRandomizer implements ITileRandomizer {
  randomColor(colors: TileColor[]): TileColor {
    const index = Math.floor(Math.random() * colors.length);
    return colors[index];
  }

  randomSuperType(): SuperType {
    const types = [SuperType.Row, SuperType.Column, SuperType.Radius, SuperType.Full];
    const weights = [0.3, 0.3, 0.25, 0.15];
    let sum = 0;
    const r = Math.random();
    for (let i = 0; i < types.length; i++) {
      sum += weights[i];
      if (r <= sum) {
        return types[i];
      }
    }
    return SuperType.Row;
  }
}