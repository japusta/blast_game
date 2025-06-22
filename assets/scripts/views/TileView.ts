// assets/scripts/views/TileView.ts

import { TileModel, SuperType } from '../models/TileModel';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileView extends cc.Component {
  @property(cc.Sprite)
  sprite: cc.Sprite = null;

  @property([cc.SpriteFrame])
  frames: cc.SpriteFrame[] = [];

  @property({ type: cc.SpriteFrame })
  superRowFrame: cc.SpriteFrame = null;

  @property({ type: cc.SpriteFrame })
  superColumnFrame: cc.SpriteFrame = null;

  @property({ type: cc.SpriteFrame })
  superRadiusFrame: cc.SpriteFrame = null;

  @property({ type: cc.SpriteFrame })
  superFullFrame: cc.SpriteFrame = null;

  @property(cc.Prefab)
  rocketRowPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  rocketColumnPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  explosionPrefab: cc.Prefab = null;

  @property(cc.Prefab)
  rocketTrailPrefab: cc.Prefab = null;

  @property(cc.Vec2)
  rocketRowOffset: cc.Vec2 = new cc.Vec2(0, 0);

  @property(cc.Vec2)
  rocketColumnOffset: cc.Vec2 = new cc.Vec2(0, 0);

  @property(cc.Vec2)
  explosionOffset: cc.Vec2 = new cc.Vec2(0, 0);

  private model!: TileModel;
  private clickCallback!: (r: number, c: number) => void;

  init(tile: TileModel, cb: (r: number, c: number) => void) {
    this.model = tile;
    this.clickCallback = cb;
    this.updateView();
    this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
  }

  private updateView() {
    if (this.model.isSuper) {
      this.sprite.spriteFrame = this.getSuperSpriteFrame(this.model.superType);
      cc.tween(this.node)
        .set({ scale: 0 })
        .to(0.3, { scale: 1.2 }, { easing: cc.easing.backOut })
        .start();
    } else {
      this.sprite.spriteFrame = this.frames[this.model.color];
      this.node.setScale(1, 1, 1);
    }
  }

  private getSuperSpriteFrame(type: SuperType): cc.SpriteFrame {
    switch (type) {
      case SuperType.Row:
        return this.superRowFrame;
      case SuperType.Column:
        return this.superColumnFrame;
      case SuperType.Radius:
        return this.superRadiusFrame;
      case SuperType.Full:
        return this.superFullFrame;
      default:
        return this.frames[this.model.color];
    }
  }

  private onTouchEnd() {
    this.clickCallback(this.model.row, this.model.col);
  }
}