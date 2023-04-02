import { en } from './en';
import { zh } from './zh';

export type SupportedLocale = 'zh' | 'en'

export type MessageIds = (keyof typeof zh) & (keyof typeof en)