import { BoosterType } from "../models/BoosterType";
import { GameModel } from "../models/GameModel";
import ButtonHoverEffect from "./ButtonHoverEffect";
import ButtonActiveEffect from "./ButtonActiveEffect";

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
    private shuffleButton: cc.Button,
    private scoreLabel: cc.Label,
    private movesLabel: cc.Label,
    private countBombLabel: cc.Label,
    private countTeleportLabel: cc.Label,
    private countShuffleLabel: cc.Label,
    private restartGame: (
      rows: number,
      cols: number,
      moves: number,
      target: number
    ) => void,
    private onBoosterSelect: (booster: BoosterType) => void,
    private onShuffle: () => void
  ) {}

  public init() {
    this.hideAllPopups();

    [this.winPopup, this.losePopup].forEach((popup) => {
      const restartBtn = popup.getChildByName("RestartButtonTemplate");
      if (restartBtn) {
        restartBtn
          .getComponent(cc.Button)!
          .node.on("click", this.onRestartDefault, this);
      }
      const customBtn = popup.getChildByName("ShowCustomBtn");
      if (customBtn) {
        customBtn
          .getComponent(cc.Button)!
          .node.on("click", this.onShowCustom, this);
      }
    });

    this.startCustomBtn.node.on("click", this.onRestartCustom, this);
    this.bombButton.node.on("click", this.onBombButton, this);
    this.teleportButton.node.on("click", this.onTeleportButton, this);
    this.shuffleButton.node.on("click", this.onShuffleButton, this);
    this.bombButton.node.addComponent(ButtonHoverEffect);
    this.teleportButton.node.addComponent(ButtonHoverEffect);
    this.shuffleButton.node.addComponent(ButtonHoverEffect);
    this.bombButton.node.addComponent(ButtonActiveEffect).enabled = false;
    this.teleportButton.node.addComponent(ButtonActiveEffect).enabled = false;
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

  public updateUI(model: GameModel, active: BoosterType | null = null) {
    this.scoreLabel.string = `ОЧКИ: ${model.score}/${model.targetScore}`;
    this.movesLabel.string = `${model.movesLeft}`;
    this.countBombLabel.string = `${model.bomb.count}`;
    this.countTeleportLabel.string = `${model.teleport.count}`;
    this.countShuffleLabel.string = `перемешать: ${model.shuffleLeft}`;
    this.bombButton.interactable = model.bomb.count > 0;
    this.teleportButton.interactable = model.teleport.count > 0;
    this.shuffleButton.interactable = model.canShuffle();
    this.bombButton.node.opacity = active === BoosterType.Bomb ? 180 : 255;
    this.teleportButton.node.opacity =
      active === BoosterType.Teleport ? 180 : 255;
    const bombActive = this.bombButton.node.getComponent(ButtonActiveEffect)!;
    const teleportActive =
      this.teleportButton.node.getComponent(ButtonActiveEffect)!;
    bombActive.enabled = active === BoosterType.Bomb;
    teleportActive.enabled = active === BoosterType.Teleport;
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
    this.onBoosterSelect(BoosterType.Bomb);
  };

  private onTeleportButton = () => {
    this.onBoosterSelect(BoosterType.Teleport);
  };

  private onShuffleButton = () => {
    this.onShuffle();
  };
}

export default UIManager;
