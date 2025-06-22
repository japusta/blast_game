// assets/scripts/views/GameController.ts

import { GameModel } from "../models/GameModel";
import { ClickResult } from "../models/ClickResult";
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

  private readonly tileSize = 130;
  private readonly tileGap = 2;

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

    // создаём новую модель
    this.model = new GameModel(rows, cols, moves, target);

    // рендерим поле и обновляем HUD
    this.renderGrid();
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


  /** Базовый render (без анимаций) */
  private renderGrid() {
    this.gridNode.removeAllChildren();
    for (const rowArr of this.model.board.grid) {
      for (const tile of rowArr) {
        if (!tile) continue;
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

      // Ждём завершения анимации обмена тайлов перед перерисовкой
      await Promise.all(
        res.moved.map((mv) => {
          const node = this.gridNode.getChildByName(
            `tile_${mv.from.r}_${mv.from.c}`
          )!;
          return new Promise<void>((resolve) => {
            cc.tween(node)
              .to(
                0.2,
                { position: this.toPosition(mv.to.c, mv.to.r) },
                { easing: cc.easing.sineInOut }
              )
              .call(() => resolve())
              .start();
          });
        })
      );

      // ⏳⚠️ Сначала полностью ждём анимацию, только затем перерисовываем поле
      this.renderGrid();

      this.teleportFrom = null;
      this.useBooster = null;
      this.updateUI();
      return;
    }

    res = this.model.click(row, col, this.useBooster);

    this.useBooster = null;
    this.teleportFrom = null;
    this.updateUI();

      // --- 1. МГНОВЕННОЕ ИСЧЕЗНОВЕНИЕ СУПЕРТАЙЛА ---
  // Если клик был по супертайлу (res.super — координаты активированного)
  if (res.super && res.removed.some(t => t.row === res.super!.row && t.col === res.super!.col)) {
    const { row: sRow, col: sCol } = res.super;
    const superNode = this.gridNode.getChildByName(`tile_${sRow}_${sCol}`);
    if (superNode) {
      await new Promise<void>((resolve) => {
        cc.tween(superNode)
          .to(0.18, { scale: 0.1, opacity: 0 }, { easing: cc.easing.cubicIn })
          .call(() => {
            superNode.destroy();
            resolve();
          })
          .start();
      });
    }
  }

    // --- 1. АНИМАЦИЯ УДАЛЕНИЯ ---
    await Promise.all(
      res.removed.map(({ row, col }) => {
        const n = this.gridNode.getChildByName(`tile_${row}_${col}`);
        if (!n) return Promise.resolve();
        return new Promise<void>((resolve) => {
          cc.tween(n)
            .to(0.2, { scale: 0, opacity: 0 }, { easing: cc.easing.quadIn })
            .call(() => {
              n.destroy();
              resolve();
            })
            .start();
        });
      })
    );

    // --- 2. АНИМАЦИЯ ПАДЕНИЯ ---
    await Promise.all(
      res.moved.map((mv) => {
        const node = this.gridNode.getChildByName(
          `tile_${mv.from.r}_${mv.from.c}`
        );
        if (!node) return Promise.resolve();
        node.name = `tile_${mv.to.r}_${mv.to.c}`;
        return new Promise<void>((resolve) => {
          cc.tween(node)
            .to(
              0.3,
              { position: this.toPosition(mv.to.c, mv.to.r) },
              { easing: cc.easing.quadOut }
            )
            .call(() => resolve())
            .start();
        });
      })
    );

    // --- 3. АНИМАЦИЯ ПОЯВЛЕНИЯ ---
    await Promise.all(
      res.created.map((cr) => {
        const n = cc.instantiate(this.tilePrefab);
        n.name = `tile_${cr.row}_${cr.col}`;
        const up = this.toPosition(cr.col, -1);
        n.setPosition(new cc.Vec3(up.x, up.y + this.tileSize, 0));
        // ВНИМАНИЕ: теперь обязательно передавать модельку TileModel!
        const tile = this.model.board.grid[cr.row][cr.col];
        n.getComponent("TileView")!.init(tile, this.onTileClicked.bind(this));
        this.gridNode.addChild(n);
        return new Promise<void>((resolve) => {
          cc.tween(n)
            .to(
              0.3,
              { position: this.toPosition(cr.col, cr.row) },
              { easing: cc.easing.backOut }
            )
            .call(() => resolve())
            .start();
        });
      })
    );

    // --- 4. ПОСЛЕ ВСЕХ АНИМАЦИЙ ПОЛНЫЙ ПЕРЕРЕНДЕР ---
    this.renderGrid();

    // --- 5. UI & ENDGAME ---
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
