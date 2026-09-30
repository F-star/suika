import { type FC, useEffect, useState } from 'react';

import { shellService, type ShellState } from '../lib/shell-service';
import { Home } from './Home';
import { useLocale } from './i18n';
import { TabBar } from './TabBar';

export const Shell: FC = () => {
  const [state, setState] = useState<ShellState>({
    tabs: [],
    isHomeActive: true,
  });
  const shell = shellService();
  const { locale, t } = useLocale();

  useEffect(() => {
    if (!shell) return;
    const unsubscribe = shell.onStateChange(setState);
    shell.getState().then(setState);
    return unsubscribe;
  }, [shell]);

  if (!shell) return null;

  return (
    <div className="flex h-screen flex-col">
      <TabBar shell={shell} state={state} t={t} />
      {/* Editor views cover this area unless Home is active. */}
      {state.isHomeActive && <Home shell={shell} locale={locale} t={t} />}
    </div>
  );
};
