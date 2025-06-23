import { GameModel } from "../models/GameModel";
import { ClickResult } from "../models/ClickResult";
import { GridView } from "./GridView";
import { IGridView } from "./IGridView";
import { GameFactory } from "../models/GameFactory";
import { BoosterType } from "../models/BoosterType";

import UIManager from "./UIManager";
const { ccclass, property } = cc._decorator;

@ccclass
export default class GameController extends cc.Component {
  //  Prefab + Grid 
  @property(cc.Prefab) tilePrefab!: cc.Prefab;
  @property(cc.Node) gridNode!: cc.Node;

  //  поля HUD} 
  @property(cc.Label) scoreLabel!: cc.Label;
  @property(cc.Label) movesLabel!: cc.Label;
  // @property(cc.Label) boosterLabel!: cc.Label;

  //  Попап контейнеры и окна 
  @property(cc.Node) popupContainer!: cc.Node;
  @property(cc.Node) winPopup!: cc.Node;
  @property(cc.Node) losePopup!: cc.Node;
  @property(cc.Node) customPopup!: cc.Node;

  //  кастомные кнопки и кнопка старт 
  @property(cc.EditBox) movesInput!: cc.EditBox;
  @property(cc.EditBox) scoreInput!: cc.EditBox;
  @property(cc.Button) startCustomBtn!: cc.Button;
  /** Кнопки бустеров */
  @property(cc.Button) bombButton!: cc.Button;
  @property(cc.Button) teleportButton!: cc.Button;

  /** Лейблы для оставшихся применений */
  @property(cc.Label) countBombLabel!: cc.Label;
  @property(cc.Label) countTeleportLabel!: cc.Label;
  private model!: GameModel;
  private gridView!: IGridView;
  private useBooster: BoosterType | null = null;
  private teleportFrom: [number, number] | null = null;
  private uiManager!: UIManager;
  private gameFactory: GameFactory = new GameFactory();
  private gameOver = false;

  private readonly tileSize = 130;
  private readonly tileGap = 2;

  public setGameFactory(factory: GameFactory) {
    this.gameFactory = factory;
  }

  onLoad() {
    this.uiManager = new UIManager(
      this.popupContainer,
      this.winPopup,
      this.losePopup,
      this.customPopup,
      this.movesInput,
      this.scoreInput,
      this.startCustomBtn,
      this.bombButton,
      this.teleportButton,
      this.scoreLabel,
      this.movesLabel,
      this.countBombLabel,
      this.countTeleportLabel,
      (r, c, m, t) => this._restartGame(r, c, m, t),
      (booster) => {
        this.useBooster = booster;
        if (booster === BoosterType.Teleport) this.teleportFrom = null;
        this.uiManager.updateUI(this.model);
      }
    );
    this.uiManager.init();
  }

  start() {
    // первый запуск  дефолтные параметры
    this._restartGame(10, 10, 20, 500);
  }

  /** метод перезапуск игры */
  private _restartGame(
    rows: number,
    cols: number,
    moves: number,
    target: number
  ) {
    this.uiManager.hideAllPopups();
    this.gameOver = false;

    // создаём новую модель через фабрику
    this.model = this.gameFactory.create(rows, cols, moves, target);
    // создаём представление поля
    this.gridView = new GridView(this.gridNode, this.tilePrefab, this.tileSize, this.tileGap);

    // рендерим поле и обновляем HUD
    this.gridView.render(this.model, this.onTileClicked.bind(this));
    this.uiManager.updateUI(this.model);
  }

  /** Обработка клика + анимации + проверка конца */
  private async onTileClicked(row: number, col: number) {
    if (this.gameOver) return;

    if (this.useBooster === BoosterType.Teleport) {
      await this.handleTeleportClick(row, col);
      return;
    }

    await this.handleRegularClick(row, col);
  }

  private async handleTeleportClick(row: number, col: number) {
    if (!this.teleportFrom) {
      this.teleportFrom = [row, col];
      this.uiManager.updateUI(this.model);
      return;
    }

    const [r1, c1] = this.teleportFrom;
    const res = this.model.click(row, col, BoosterType.Teleport, r1, c1);

    if (res.moved.length === 0) {
      this.teleportFrom = null;
      this.useBooster = null;
      this.uiManager.updateUI(this.model);
      return;
    }

    await this.gridView.animateSwap(res.moved, this.model);
    this.gridView.render(this.model, this.onTileClicked.bind(this));
    this.teleportFrom = null;
    this.useBooster = null;
    this.uiManager.updateUI(this.model);
  }

  private async handleRegularClick(row: number, col: number) {
    const used = this.useBooster;

    const res = this.model.click(row, col, this.useBooster);

    this.useBooster = null;
    this.teleportFrom = null;

    await this.gridView.animateResult(
      res,
      this.model,
      this.onTileClicked.bind(this),
      row,
      col,
      used
    );
    this.uiManager.updateUI(this.model);
    if (this.model.score >= this.model.targetScore) {
      this.uiManager.showPopup(this.winPopup);
      this.gameOver = true;
     
    } else if (this.model.movesLeft <= 0) {
      this.uiManager.showPopup(this.losePopup);
      this.gameOver = true;

    }
  }

}