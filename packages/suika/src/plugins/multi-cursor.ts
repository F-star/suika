import { type HocuspocusProvider } from '@hocuspocus/provider';
import { type SuikaEditor } from '@suika/core';
import { type IPoint } from '@suika/geo';

export class MultiCursorManager {
  private users = new Map<
    string,
    { name: string; color: string; pos: IPoint; updatedAt: string }
  >();

  constructor(
    private editor: SuikaEditor,
    private awareness: NonNullable<HocuspocusProvider['awareness']>,
  ) {}

  private onAwarenessChange() {
    console.log(Array.from(this.awareness.getStates().values()));
  }

  private onEditorViewPortRender() {
    // 绘制光标。
    for (const user of this.users.values()) {
      // 场景坐标，转为视口坐标
      const pos = this.editor.sceneCoordsToViewport(user.pos.x, user.pos.y);
      console.log('cursor pos:', pos);
    }
  }

  active() {
    // 1. 监听 render 事件，补画一个 cursor。
    /**
     * this.editor.on('render', (ctx) => {
     *   ctx.drawImage(canvas)
     * })
     */
    // 2. 监听 yjs 的 awareness 的变更，及时更新画布。
    this.awareness.on('change', this.onAwarenessChange);
  }

  inactive() {
    /**
     *
     */
    this.awareness.off('change', this.onAwarenessChange);
  }

  on() {
    // editor 顶部栏组件监听用户状态的改变，更新协同头像
  }
}
