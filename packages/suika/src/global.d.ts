import { en } from './locale/en';
import { zh } from './locale/zh';

declare global {
  namespace FormatjsIntl {
    interface IntlConfig {
      locale: 'en' | 'zh'
    }
  }
}

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: (keyof typeof zh) & (keyof typeof en)
    }
  }
}