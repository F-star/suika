import { SupportedLocale } from './locale';
import { EventEmitter } from '@suika/common';

interface Events {
  localeChange: (locale: SupportedLocale) => void;
}

export const appEventEmitter = new EventEmitter<Events>();
