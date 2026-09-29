import { genUuid } from '@suika/common';

import { type ICommand } from './type';

export abstract class BaseCommand implements ICommand {
  readonly id = genUuid();

  constructor(public desc: string) {}

  abstract redo(): void;
  abstract undo(): void;
}
