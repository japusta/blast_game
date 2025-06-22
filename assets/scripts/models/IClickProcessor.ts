export interface IClickProcessor {
  process(
    row: number,
    col: number,
    useBooster?: import("./Boosters").BoosterType | null,
    r2?: number,
    c2?: number
  ): import("./ClickOutcome").ClickOutcome;
}