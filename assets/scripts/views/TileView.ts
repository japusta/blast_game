// assets/scripts/views/TileView.ts

import { TileModel } from '../models/TileModel';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileView extends cc.Component {
  @property(cc.Sprite)
  sprite: cc.Sprite = null;

  @property([cc.SpriteFrame])
  frames: cc.SpriteFrame[] = [];

  private model!: TileModel;
  private clickCallback!: (r: number, c: number) => void;

  /**
   * Инициализируется из GameController.renderGrid
   */
  init(tile: TileModel, cb: (r: number, c: number) => void) {
    this.model = tile;
    this.clickCallback = cb;
    this.updateView();
    this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  private updateView() {
    // Ставим спрайт по цвету
    this.sprite.spriteFrame = this.frames[this.model.color];
    // Если супер-тайл — чуть увеличим
    const s = this.model.isSuper ? 1.2 : 1;
    this.node.setScale(s, s, s);
  }

  private onTouchEnd() {
    this.clickCallback(this.model.row, this.model.col);
  }
}
