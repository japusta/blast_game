const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonActiveEffect extends cc.Component {
  @property
  scaleFactor: number = 1.1;

  @property
  duration: number = 0.4;

  private tween?: cc.Tween;

  onEnable() {
    this.startTween();
  }

  onDisable() {
    this.stopTween();
  }

  private startTween() {
    this.tween = cc.tween(this.node)
      .repeatForever(
        cc.tween()
          .to(this.duration, { scale: this.scaleFactor })
          .to(this.duration, { scale: 1 })
      )
      .start();
  }

  private stopTween() {
    if (this.tween) {
      this.tween.stop();
      this.node.scale = 1;
      this.tween = undefined;
    }
  }
}