import { genId, objectNameGenerator } from '@suika/common';

import { type IObject } from '../type';
import { type IGroupAttrs } from './type';

export class Group implements IGroupAttrs {
  id: string;
  rotation?: number;
  objectName: string;

  constructor(attrs: Partial<IGroupAttrs> = {}) {
    this.id = attrs.id ?? genId();
    if (attrs.rotation) {
      this.rotation = attrs.rotation;
    }

    if (attrs.objectName) {
      this.objectName = attrs.objectName;
      objectNameGenerator.setMaxIdx(attrs.objectName);
    } else {
      this.objectName = objectNameGenerator.gen('Group');
    }
  }

  toObject(): IObject {
    return {
      id: this.id,
      type: 'group',
      name: this.objectName,
      visible: true,
      lock: false,
    };
  }
}
