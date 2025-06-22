// assets/scripts/views/GameController.ts

import { GameModel } from "../models/GameModel";
import { ClickResult } from "../models/ClickResult";
import { GridView } from "./GridView";
import { IGridView } from "./IGridView";
import { GameFactory } from "../models/GameFactory";
const { ccclass, property } = cc._decorator;

@ccclass
export default class GameController extends cc.Component {
  // ——— Prefab + Grid ———
  @property(cc.Prefab) tilePrefab!: cc.Prefab;
  @property(cc.Node) gridNode!: cc.Node;

  // ——— HUD Labels ———
  @property(cc.Label) scoreLabel!: cc.Label;
  @property(cc.Label) movesLabel!: cc.Label;
  // @property(cc.Label) boosterLabel!: cc.Label;

  // ——— Popups Container + Windows ———
  @property(cc.Node) popupContainer!: cc.Node;
  @property(cc.Node) winPopup!: cc.Node;
  @property(cc.Node) losePopup!: cc.Node;
  @property(cc.Node) customPopup!: cc.Node;

  // ——— Custom Inputs + Start Button ———
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
  private useBooster: string | null = null;
  private teleportFrom: [number, number] | null = null;
  private gameFactory: GameFactory = new GameFactory();

  private readonly tileSize = 130;
  private readonly tileGap = 2;

  public setGameFactory(factory: GameFactory) {
    this.gameFactory = factory;
  }

  onLoad() {
    // 1) Скрываем все попапы
    this.popupContainer.active = false;
    this.winPopup.active = false;
    this.losePopup.active = false;
    this.customPopup.active = false;

    // 2) Вешаем обработчики на кнопки внутри Win/Lose
    [this.winPopup, this.losePopup].forEach((popup) => {
      // кнопка «Сыграть ещё раз»
      const restartBtn = popup.getChildByName("RestartButtonTemplate");
      if (restartBtn) {
        restartBtn
          .getComponent(cc.Button)!
          .node.on("click", this.onRestartDefault, this);
      }
      // кнопка «Задать свои параметры»
      const customBtn = popup.getChildByName("ShowCustomBtn");
      if (customBtn) {
        customBtn
          .getComponent(cc.Button)!
          .node.on("click", this.onShowCustom, this);
      }
    });

    // 3) Кнопка «Старт с кастомными» внутри формы
    this.startCustomBtn.node.on("click", this.onRestartCustom, this);
    // при клике на иконку бомбы
    this.bombButton.node.on("click", this.onBombButton, this);
    // при клике на иконку телепорта
    this.teleportButton.node.on("click", this.onTeleportButton, this);
  }

  start() {
    // Первый запуск — дефолтные параметры
    this._restartGame(10, 10, 20, 500);
  }

  /** Общий метод (пере)старта */
  private _restartGame(
    rows: number,
    cols: number,
    moves: number,
    target: number
  ) {
    // спрячем все попапы
    this.popupContainer.active = false;
    this.winPopup.active = false;
    this.losePopup.active = false;
    this.customPopup.active = false;

    // создаём новую модель через фабрику
    this.model = this.gameFactory.create(rows, cols, moves, target);
    // создаём представление поля
    this.gridView = new GridView(this.gridNode, this.tilePrefab, this.tileSize, this.tileGap);

    // рендерим поле и обновляем HUD
    this.gridView.render(this.model, this.onTileClicked.bind(this));
    this.updateUI();
  }

  /** Дефолтный рестарт (из Win/Lose) */
  private onRestartDefault() {
    this._restartGame(10, 10, 20, 500);
  }

  /** Показать форму кастомных настроек */
  private onShowCustom() {
    // показываем фон
    this.popupContainer.active = true;
    // прячем окна Win/Lose
    this.winPopup.active = false;
    this.losePopup.active = false;
    // показываем форму
    this.customPopup.active = true;
  }

  /** Перезапустить с кастомными параметрами */
private onRestartCustom() {
  const movesStr = this.movesInput.string.trim();
  const scoreStr = this.scoreInput.string.trim();

  let moves = parseInt(movesStr, 10);
  let score = parseInt(scoreStr, 10);

  // Жёсткая валидация
  if (
    isNaN(moves) ||
    isNaN(score) ||
    moves < 1 ||
    moves > 999 ||         // свои лимиты!
    score < 10 ||
    score > 100000
  ) {
    // Можно показать popup, label или alert
    cc.log("Неверные параметры! Ходы: 1-99, Очки: 10-100000");
    // Например, выделить input красным:
    this.movesInput.node.color = cc.Color.RED;
    this.scoreInput.node.color = cc.Color.RED;
    // Или popup (если хочешь)
    return;
  }

  // Восстанавливаем нормальный цвет
  this.movesInput.node.color = cc.Color.WHITE;
  this.scoreInput.node.color = cc.Color.WHITE;

  this._restartGame(10, 10, moves, score);
}




  /** Обработка клика + анимации + проверка конца */
  private async onTileClicked(row: number, col: number) {
    let res: ClickResult;

    if (this.useBooster === "teleport") {
      if (!this.teleportFrom) {
        this.teleportFrom = [row, col];
        this.updateUI();
        return;
      }

      const [r1, c1] = this.teleportFrom;
      res = this.model.click(row, col, "teleport", r1, c1);

      if (res.moved.length === 0) {
        this.teleportFrom = null;
        this.useBooster = null;
        this.updateUI();
        return;
      }

      await this.gridView.animateSwap(res.moved, this.model);
      this.gridView.render(this.model, this.onTileClicked.bind(this));
      this.teleportFrom = null;
      this.useBooster = null;
      this.updateUI();
      return;
    }

    res = this.model.click(row, col, this.useBooster);
    this.useBooster = null;
    this.teleportFrom = null;

    await this.gridView.animateResult(res, this.model, this.onTileClicked.bind(this));

    this.updateUI();
    if (this.model.score >= this.model.targetScore) {
      this.showPopup(this.winPopup);
    } else if (this.model.movesLeft <= 0) {
      this.showPopup(this.losePopup);
    }
  }

  /** Показ нужного попапа + блок кликов по полю */
  private showPopup(popup: cc.Node) {
    this.popupContainer.active = true;
    // блокируем тайлы
    this.gridNode.children.forEach((n) => n.off(cc.Node.EventType.TOUCH_END));
    // прячем всё, кроме нужного
    this.winPopup.active = false;
    this.losePopup.active = false;
    this.customPopup.active = false;
    popup.active = true;
  }

  /** Обновление HUD */
  private updateUI() {
    this.scoreLabel.string = `ОЧКИ: ${this.model.score}/${this.model.targetScore}`;
    this.movesLabel.string = `${this.model.movesLeft}`;

    // новые строчки
    this.countBombLabel.string = `${this.model.bomb.count}`;
    this.countTeleportLabel.string = `${this.model.teleport.count}`;
    // this.boosterLabel.string = this.useBooster
    //   ? `Booster: ${this.useBooster}`
    //   : "Booster: none";
  }


  /** Бомба */
  public onBombButton() {
    this.useBooster = "bomb";
    this.updateUI();
  }

  /** Телепорт */
  public onTeleportButton() {
    // if (!this.teleportFrom) this.teleportFrom = [0, 0];
    // this.useBooster = "teleport";
    this.useBooster = "teleport";
    this.teleportFrom = null;
    this.updateUI();
  }
}