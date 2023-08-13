import { isWindows } from '../utils/common';
import { Editor } from './editor';

interface IKey {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  /**
   * KeyboardEvent['code'] or '*'(match any key)
   */
  keyCode: string;
}

interface IWhenCtx {
  isToolDragging: boolean;
}

interface IKeyBinding {
  key: IKey | IKey[];
  winKey?: IKey | IKey[];
  when?: (ctx: IWhenCtx) => boolean;
  /**
   * action name (just for debug)
   */
  actionName: string;
  action: (e: KeyboardEvent) => void;
}

const getKeyStr = (e: KeyboardEvent) => {
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
  } = e;

  return `${ctrlKey ? 'ctrl+' : ''}${metaKey ? 'meta+' : ''}${
    shiftKey ? 'shift+' : ''
  }${altKey ? 'alt+' : ''}${e.code}`;
};

/**
 * key binding manager
 */
export class KeyBindingManager {
  private keyBindingMap = new Map<number, IKeyBinding>();
  private isBound = false;
  private id = 0;

  constructor(private editor: Editor) {}

  private handleAction = (e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    let isMatch = false;
    const ctx: IWhenCtx = {
      isToolDragging: this.editor.toolManager.isDragging,
    };

    for (const keyBinding of this.keyBindingMap.values()) {
      // match when
      if (!keyBinding.when || keyBinding.when(ctx)) {
        // match windows os
        if (isWindows) {
          if (keyBinding.winKey && this.isKeyMatch(keyBinding.winKey, e)) {
            isMatch = true;
          }
        }
        // match other os
        else if (this.isKeyMatch(keyBinding.key, e)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        e.preventDefault();
        console.log(`[${getKeyStr(e)}] => ${keyBinding.actionName}`);
        keyBinding.action(e);
        break;
      }
    }

    if (!isMatch) {
      console.log(`[${getKeyStr(e)}] => no match`);
    }
  };

  private isKeyMatch(key: IKey | IKey[], e: KeyboardEvent): boolean {
    if (Array.isArray(key)) {
      return key.some((k) => this.isKeyMatch(k, e));
    }

    if (key.keyCode == '*') return true;

    const {
      ctrlKey = false,
      shiftKey = false,
      altKey = false,
      metaKey = false,
    } = key;

    return (
      ctrlKey == e.ctrlKey &&
      shiftKey == e.shiftKey &&
      altKey == e.altKey &&
      metaKey == e.metaKey &&
      key.keyCode == e.code
    );
  }

  register(keybinding: IKeyBinding) {
    const id = this.id;
    this.keyBindingMap.set(id, keybinding);

    this.id++;
    return id;
  }

  registerWithHighPrior(keybinding: IKeyBinding) {
    const id = this.id;

    const map = new Map<number, IKeyBinding>();
    map.set(id, keybinding);

    for (const [key, val] of this.keyBindingMap) {
      map.set(key, val);
    }
    this.keyBindingMap = map;
    this.id++;
    return id;
  }

  unregister(id: number) {
    this.keyBindingMap.delete(id);
  }

  bindEvent() {
    if (this.isBound) return;
    this.isBound = true;
    document.addEventListener('keydown', this.handleAction);
  }
  destroy() {
    if (!this.isBound) return;
    this.keyBindingMap.clear();
    document.removeEventListener('keydown', this.handleAction);
  }
}
