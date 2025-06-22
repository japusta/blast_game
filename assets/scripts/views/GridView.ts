import { GameModel } from "../models/GameModel";
import { ClickResult } from "../models/ClickResult";
import { TileModel, SuperType } from "../models/TileModel";
import { IGridView } from "./IGridView";

export class GridView implements IGridView {
  constructor(
    private gridNode: cc.Node,
    private tilePrefab: cc.Prefab,
    private tileSize: number,
    private tileGap: number
  ) {}

  render(model: GameModel, onClick: (r: number, c: number) => void): void {
    this.gridNode.removeAllChildren();
    for (const rowArr of model.board.gridData) {
      for (const tile of rowArr) {
        if (!tile) continue;
        const node = cc.instantiate(this.tilePrefab);
        node.name = `tile_${tile.row}_${tile.col}`;
        node.setPosition(this.toPosition(model, tile.col, tile.row));
        node.getComponent('TileView')!.init(tile, onClick);
        this.gridNode.addChild(node);
      }
    }
  }

  async animateSwap(
    moved: { from: { r: number; c: number }; to: { r: number; c: number } }[],
    model: GameModel
  ): Promise<void> {
    await Promise.all(
      moved.map((mv) => {
        const node = this.gridNode.getChildByName(`tile_${mv.from.r}_${mv.from.c}`)!;
        return new Promise<void>((resolve) => {
          cc.tween(node)
            .to(
              0.2,
              { position: this.toPosition(model, mv.to.c, mv.to.r) },
              { easing: cc.easing.sineInOut }
            )
            .call(() => resolve())
            .start();
        });
      })
    );
  }

  async animateResult(
    result: ClickResult,
    model: GameModel,
    onClick: (r: number, c: number) => void,
    clickRow?: number,
    clickCol?: number
  ): Promise<void> {
    const trigger = result.triggerType;
    if (
      trigger != null &&
      clickRow != null &&
      clickCol != null
    ) {
      const startNode = this.gridNode.getChildByName(`tile_${clickRow}_${clickCol}`);
      const tv = startNode ? (startNode.getComponent('TileView') as any) : null;
      if (startNode && tv) {
        const startPos = this.toPosition(model, clickCol, clickRow);
        if (trigger === SuperType.Row && tv.rocketRowPrefab) {
          const left = cc.instantiate(tv.rocketRowPrefab);
          const right = cc.instantiate(tv.rocketRowPrefab);
          left.setPosition(startPos);
          right.setPosition(startPos);
          this.gridNode.addChild(left);
          this.gridNode.addChild(right);
          await Promise.all([
            new Promise<void>((res) => {
              cc.tween(left)
                .to(0.3, { position: this.toPosition(model, 0, clickRow) })
                .call(() => {
                  left.destroy();
                  res();
                })
                .start();
            }),
            new Promise<void>((res) => {
              cc.tween(right)
                .to(0.3, { position: this.toPosition(model, model.board.cols - 1, clickRow) })
                .call(() => {
                  right.destroy();
                  res();
                })
                .start();
            }),
          ]);
        } else if (trigger === SuperType.Column && tv.rocketColumnPrefab) {
          const up = cc.instantiate(tv.rocketColumnPrefab);
          const down = cc.instantiate(tv.rocketColumnPrefab);
          up.setPosition(startPos);
          down.setPosition(startPos);
          this.gridNode.addChild(up);
          this.gridNode.addChild(down);
          await Promise.all([
            new Promise<void>((res) => {
              cc.tween(up)
                .to(0.3, { position: this.toPosition(model, clickCol, 0) })
                .call(() => {
                  up.destroy();
                  res();
                })
                .start();
            }),
            new Promise<void>((res) => {
              cc.tween(down)
                .to(0.3, { position: this.toPosition(model, clickCol, model.board.rows - 1) })
                .call(() => {
                  down.destroy();
                  res();
                })
                .start();
            }),
          ]);
        } else if (trigger === SuperType.Radius && tv.explosionPrefab) {
          const exp = cc.instantiate(tv.explosionPrefab);
          exp.setPosition(startPos);
          this.gridNode.addChild(exp);
          await new Promise<void>((res) => {
            cc.tween(exp)
              .to(0.5, { opacity: 0 })
              .call(() => {
                exp.destroy();
                res();
              })
              .start();
          });
        }
      }
    }
    if (result.super && result.removed.some(t => t.row === result.super!.row && t.col === result.super!.col)) {
      const { row: sRow, col: sCol } = result.super!;
      const superNode = this.gridNode.getChildByName(`tile_${sRow}_${sCol}`);
      if (superNode) {
        await new Promise<void>(resolve => {
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

    await Promise.all(
      result.removed.map(({ row, col }) => {
        const n = this.gridNode.getChildByName(`tile_${row}_${col}`);
        if (!n) return Promise.resolve();
        return new Promise<void>(resolve => {
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

    await Promise.all(
      result.moved.map(mv => {
        const node = this.gridNode.getChildByName(`tile_${mv.from.r}_${mv.from.c}`);
        if (!node) return Promise.resolve();
        node.name = `tile_${mv.to.r}_${mv.to.c}`;
        return new Promise<void>((resolve) => {
          cc.tween(node)
            .to(
              0.3,
              { position: this.toPosition(model, mv.to.c, mv.to.r) },
              { easing: cc.easing.quadOut }
            )
            .call(() => resolve())
            .start();
        });
      })
    );

    await Promise.all(
      result.created.map(cr => {
        const n = cc.instantiate(this.tilePrefab);
        n.name = `tile_${cr.row}_${cr.col}`;
        const up = this.toPosition(model, cr.col, -1);
        n.setPosition(new cc.Vec3(up.x, up.y + this.tileSize, 0));
        const tile = model.board.gridData[cr.row][cr.col] as TileModel;
        n.getComponent('TileView')!.init(tile, onClick);
        this.gridNode.addChild(n);
        return new Promise<void>(resolve => {
          cc.tween(n)
            .to(0.3, { position: this.toPosition(model, cr.col, cr.row) }, { easing: cc.easing.backOut })
            .call(() => resolve())
            .start();
        });
      })
    );

    this.render(model, onClick);
  }

  private toPosition(model: GameModel, col: number, row: number): cc.Vec3 {
    const step = this.tileSize + this.tileGap;
    const W = step * model.board.cols;
    const H = step * model.board.rows;
    return new cc.Vec3(
      col * step - W / 2 + this.tileSize / 2,
      H / 2 - row * step - this.tileSize / 2,
      0
    );
  }

}