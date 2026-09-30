import { type FC, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { shellService, type TabInfo } from '../lib/shell-service';

export const Shell: FC = () => {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const shell = shellService();

  useEffect(() => {
    if (!shell) return;
    const unsubscribe = shell.onTabsChange(setTabs);
    shell.getTabs().then(setTabs);
    return unsubscribe;
  }, [shell]);

  return (
    // Height must match TAB_BAR_HEIGHT in the desktop main process. The space
    // on one side is left for the native window controls.
    <div
      className={cn(
        'flex h-[40px] select-none items-stretch border-b border-neutral-200 bg-neutral-100 [-webkit-app-region:drag]',
        shell?.platform === 'darwin' ? 'pl-[80px]' : 'pr-[140px]',
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          title={tab.title}
          className={cn(
            'flex min-w-0 max-w-[200px] items-center gap-[6px] px-[12px] text-xs [-webkit-app-region:no-drag]',
            tab.isActive
              ? 'bg-white text-neutral-900'
              : 'text-neutral-500 hover:bg-neutral-200',
          )}
          onClick={() => shell?.activateTab(tab.id)}
        >
          <span className="truncate">{tab.title}</span>
          {tab.isDirty && (
            <span className="size-[6px] shrink-0 rounded-full bg-current" />
          )}
        </button>
      ))}
    </div>
  );
};
