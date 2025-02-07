import './App.css';

import { useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import Editor from './components/Editor';
import { appEventEmitter } from './events';
import { en, type SupportedLocale, zh } from './locale';

const messageMap = {
  zh,
  en,
};

const getLocale = (): SupportedLocale => {
  const locale = localStorage.getItem('suika-locale') || navigator.language;
  return locale.startsWith('zh') ? 'zh' : 'en';
};

function App() {
  const [locale, setLocale] = useState(getLocale());

  useEffect(() => {
    const localeChangeHandler = (locale: SupportedLocale) => {
      setLocale(locale);
    };
    appEventEmitter.on('localeChange', localeChangeHandler);
    return () => {
      appEventEmitter.off('localeChange', localeChangeHandler);
    };
  });

  return (
    <IntlProvider locale={locale} messages={messageMap[locale]}>
      <div className="suika">
        <Editor />
      </div>
    </IntlProvider>
  );
}

export default App;
