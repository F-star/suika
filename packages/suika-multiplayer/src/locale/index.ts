import enText from './en.json';
import zhText from './zh.json';

export const en = enText;
export const zh: typeof en = zhText;

export type SupportedLocale = 'zh' | 'en';
export type MessageIds = keyof typeof zh & keyof typeof en;
