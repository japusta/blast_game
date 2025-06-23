const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonHoverEffect extends cc.Component {
  @property(cc.Integer)
  offsetY: number = 5;

  @property
  duration: number = 0.1;

  private baseY: number = 0;

  onLoad() {
    this.baseY = this.node.y;
    this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onEnter, this);
    this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onLeave, this);
  }

  onDestroy() {
    this.node.off(cc.Node.EventType.MOUSE_ENTER, this.onEnter, this);
    this.node.off(cc.Node.EventType.MOUSE_LEAVE, this.onLeave, this);
  }

  private onEnter() {
    cc.tween(this.node)
      .to(this.duration, { y: this.baseY + this.offsetY, opacity: 200 })
      .start();
  }

  private onLeave() {
    cc.tween(this.node)
      .to(this.duration, { y: this.baseY, opacity: 255 })
      .start();
  }
}