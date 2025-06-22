// assets/scripts/views/UIManager.ts

import { GameModel } from "../models/GameModel";

export class UIManager {
  constructor(
    private popupContainer: cc.Node,
    private winPopup: cc.Node,
    private losePopup: cc.Node,
    private customPopup: cc.Node,
    private movesInput: cc.EditBox,
    private scoreInput: cc.EditBox,
    private startCustomBtn: cc.Button,
    private bombButton: cc.Button,
    private teleportButton: cc.Button,
    private scoreLabel: cc.Label,
    private movesLabel: cc.Label,
    private countBombLabel: cc.Label,
    private countTeleportLabel: cc.Label,
    private restartGame: (rows: number, cols: number, moves: number, target: number) => void,
    private onBoosterSelect: (booster: string) => void
  ) {}

  public init() {
    this.hideAllPopups();

    [this.winPopup, this.losePopup].forEach((popup) => {
      const restartBtn = popup.getChildByName("RestartButtonTemplate");
      if (restartBtn) {
        restartBtn.getComponent(cc.Button)!.node.on("click", this.onRestartDefault, this);
      }
      const customBtn = popup.getChildByName("ShowCustomBtn");
      if (customBtn) {
        customBtn.getComponent(cc.Button)!.node.on("click", this.onShowCustom, this);
      }
    });

    this.startCustomBtn.node.on("click", this.onRestartCustom, this);
    this.bombButton.node.on("click", this.onBombButton, this);
    this.teleportButton.node.on("click", this.onTeleportButton, this);
  }

  public hideAllPopups() {
    this.popupContainer.active = false;
    this.winPopup.active = false;
    this.losePopup.active = false;
    this.customPopup.active = false;
  }

  public showPopup(popup: cc.Node) {
    this.popupContainer.active = true;
    this.winPopup.active = false;
    this.losePopup.active = false;
    this.customPopup.active = false;
    popup.active = true;
  }

  public updateUI(model: GameModel) {
    this.scoreLabel.string = `ОЧКИ: ${model.score}/${model.targetScore}`;
    this.movesLabel.string = `${model.movesLeft}`;
    this.countBombLabel.string = `${model.bomb.count}`;
    this.countTeleportLabel.string = `${model.teleport.count}`;
  }

  private onRestartDefault = () => {
    this.restartGame(10, 10, 20, 500);
  };

  private onShowCustom = () => {
    this.popupContainer.active = true;
    this.winPopup.active = false;
    this.losePopup.active = false;
    this.customPopup.active = true;
  };

  private onRestartCustom = () => {
    const movesStr = this.movesInput.string.trim();
    const scoreStr = this.scoreInput.string.trim();

    let moves = parseInt(movesStr, 10);
    let score = parseInt(scoreStr, 10);

    if (
      isNaN(moves) ||
      isNaN(score) ||
      moves < 1 ||
      moves > 999 ||
      score < 10 ||
      score > 100000
    ) {
      cc.log("Неверные параметры! Ходы: 1-99, Очки: 10-100000");
      this.movesInput.node.color = cc.Color.RED;
      this.scoreInput.node.color = cc.Color.RED;
      return;
    }

    this.movesInput.node.color = cc.Color.WHITE;
    this.scoreInput.node.color = cc.Color.WHITE;

    this.restartGame(10, 10, moves, score);
  };

  private onBombButton = () => {
    this.onBoosterSelect("bomb");
  };

  private onTeleportButton = () => {
    this.onBoosterSelect("teleport");
  };
}

export default UIManager;
