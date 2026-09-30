import { useEffect, useState } from 'react';

import { en, type MessageIds, type SupportedLocale, zh } from '../locale';

const LOCALE_KEY = 'suika-locale';

const getLocale = (): SupportedLocale => {
  const locale = localStorage.getItem(LOCALE_KEY) || navigator.language;
  return locale.startsWith('zh') ? 'zh' : 'en';
};

/** Follows the locale chosen in any editor tab, which shares localStorage. */
export const useLocale = () => {
  const [locale, setLocale] = useState(getLocale);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_KEY) setLocale(getLocale());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const messages = locale === 'zh' ? zh : en;
  return { locale, t: (id: MessageIds) => messages[id] };
};
