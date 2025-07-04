export interface IGridView {
  render(
    model: import("../models/GameModel").GameModel,
    onClick: (r: number, c: number) => void
  ): void;
  animateSwap(
    moved: { from: { r: number; c: number }; to: { r: number; c: number } }[],
    model: import("../models/GameModel").GameModel
  ): Promise<void>;
  animateResult(
    result: import("../models/ClickResult").ClickResult,
    model: import("../models/GameModel").GameModel,
    onClick: (r: number, c: number) => void,
    clickRow?: number,
    clickCol?: number,
    boosterUsed?: import("../models/BoosterType").BoosterType | null
  ): Promise<void>;
}
