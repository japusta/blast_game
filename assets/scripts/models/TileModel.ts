export enum TileColor {
  Red,
  Green,
  Blue,
  Yellow,
  Purple
}

export enum SuperType {
  None,
  Row,
  Column,
  Radius,
  Full
}

export class TileModel {
  public static readonly ColorCount: number = 5;

  constructor(
    public row: number,
    public col: number,
    public color: TileColor,
    public superType: SuperType = SuperType.None
  ) {}

  get isSuper(): boolean {
    return this.superType !== SuperType.None;
  }
}