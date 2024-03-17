import { type MessageIds, type SupportedLocale } from './locale';

declare global {
  namespace FormatjsIntl {
    interface IntlConfig {
      locale: SupportedLocale;
    }
  }
}

declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: MessageIds;
    }
  }
}
