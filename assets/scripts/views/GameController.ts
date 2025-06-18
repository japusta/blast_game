// assets/scripts/views/GameController.ts

import { GameModel, ClickResult } from "../models/GameModel";
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
  private useBooster: string | null = null;
  private teleportFrom: [number, number] | null = null;

  private readonly tileSize = 90;
  private readonly tileGap = 8;

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
    this._restartGame(8, 8, 20, 500);
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

    // создаём новую модель
    this.model = new GameModel(rows, cols, moves, target);

    // рендерим поле и обновляем HUD
    this.renderGrid();
    this.updateUI();
  }

  /** Дефолтный рестарт (из Win/Lose) */
  private onRestartDefault() {
    this._restartGame(8, 8, 20, 500);
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
    const m = parseInt(this.movesInput.string) || 20;
    const s = parseInt(this.scoreInput.string) || 500;
    this._restartGame(8, 8, m, s);
  }

  /** Базовый render (без анимаций) */
  private renderGrid() {
    this.gridNode.removeAllChildren();
    for (const rowArr of this.model.board.grid) {
      for (const tile of rowArr) {
        const node = cc.instantiate(this.tilePrefab);
        node.name = `tile_${tile.row}_${tile.col}`;
        node.setPosition(this.toPosition(tile.col, tile.row));
        node
          .getComponent("TileView")!
          .init(tile, this.onTileClicked.bind(this));
        this.gridNode.addChild(node);
      }
    }
  }

  /** Обработка клика + анимации + проверка конца */
  private async onTileClicked(row: number, col: number) {
    // 1) модель
    let res: ClickResult;
    // if (this.useBooster === "teleport" && this.teleportFrom) {
    //   const [r2, c2] = this.teleportFrom;
    //   res = this.model.click(row, col, "teleport", r2, c2) as ClickResult;
    // } else {
    //   res = this.model.click(row, col, this.useBooster) as ClickResult;
    // }
        if (this.useBooster === "teleport") {
      // первый клик — запоминаем откуда
      if (!this.teleportFrom) {
        this.teleportFrom = [row, col];
        this.updateUI();
        return;  // ждём второго клика
      }
      // второй клик — выполняем обмен
      const [r1, c1] = this.teleportFrom;
      res = this.model.click(row, col, "teleport", r1, c1) as ClickResult;
    } else {
      // обычное удаление или бомба
      res = this.model.click(row, col, this.useBooster) as ClickResult;
    }
    this.useBooster = null;
    this.teleportFrom = null;
    this.updateUI();

    // 2) «сгорание»
    await Promise.all(
      res.removed.map(({ row, col }) => {
        const n = this.gridNode.getChildByName(`tile_${row}_${col}`)!;
        return new Promise<void>((ok) => {
          cc.tween(n)
            .to(0.2, { scale: 0, opacity: 0 }, { easing: cc.easing.quadIn })
            .call(() => {
              n.destroy();
              ok();
            })
            .start();
        });
      })
    );

    // 3) падение
    for (const mv of res.moved) {
      const key = `tile_${mv.from.r}_${mv.from.c}`;
      const n = this.gridNode.getChildByName(key)!;
      n.name = `tile_${mv.to.r}_${mv.to.c}`;
      cc.tween(n)
        .to(
          0.3,
          { position: this.toPosition(mv.to.c, mv.to.r) },
          { easing: cc.easing.quadOut }
        )
        .start();
    }

    // 4) новые сверху
    for (const cr of res.created) {
      const n = cc.instantiate(this.tilePrefab);
      n.name = `tile_${cr.row}_${cr.col}`;
      const up = this.toPosition(cr.col, -1);
      n.setPosition(new cc.Vec3(up.x, up.y + this.tileSize, 0));
      n.getComponent("TileView")!.init(
        cr as any,
        this.onTileClicked.bind(this)
      );
      this.gridNode.addChild(n);
      cc.tween(n)
        .to(
          0.3,
          { position: this.toPosition(cr.col, cr.row) },
          { easing: cc.easing.backOut }
        )
        .start();
    }

    // 5) проверка конца
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

  /** Координаты тайла → Vec3 */
  private toPosition(col: number, row: number): cc.Vec3 {
    const step = this.tileSize + this.tileGap;
    const W = step * this.model.board.cols;
    const H = step * this.model.board.rows;
    return new cc.Vec3(
      col * step - W / 2 + this.tileSize / 2,
      H / 2 - row * step - this.tileSize / 2,
      0
    );
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
