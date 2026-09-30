import { House, Plus, X } from 'lucide-react';
import { type FC } from 'react';

import { cn } from '@/lib/utils';

import { type ShellService, type ShellState } from '../lib/shell-service';
import { type MessageIds } from '../locale';

interface IProps {
  shell: ShellService;
  state: ShellState;
  t: (id: MessageIds) => string;
}

export const TabBar: FC<IProps> = ({ shell, state, t }) => (
  // Height must match TAB_BAR_HEIGHT in the desktop main process. The space
  // on one side is left for the native window controls.
  <div
    className={cn(
      'flex h-[40px] shrink-0 select-none items-stretch border-b border-neutral-200 bg-neutral-100 [-webkit-app-region:drag]',
      shell.platform === 'darwin' ? 'pl-[80px]' : 'pr-[140px]',
    )}
  >
    <button
      aria-label={t('home')}
      title={t('home')}
      className={cn(
        'flex w-[40px] shrink-0 items-center justify-center [-webkit-app-region:no-drag]',
        state.isHomeActive
          ? 'bg-white text-neutral-900'
          : 'text-neutral-500 hover:bg-neutral-200',
      )}
      onClick={() => shell.activateHome()}
    >
      <House className="size-[16px]" />
    </button>
    <div className="flex min-w-0 items-stretch">
      {state.tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.isActive}
          title={tab.title}
          className={cn(
            'group flex w-[200px] min-w-[72px] shrink items-center gap-[6px] pl-[12px] pr-[6px] text-xs [-webkit-app-region:no-drag]',
            tab.isActive
              ? 'bg-white text-neutral-900'
              : 'text-neutral-500 hover:bg-neutral-200',
          )}
          onClick={() => shell.activateTab(tab.id)}
          onAuxClick={(event) => {
            if (event.button === 1) shell.closeTab(tab.id);
          }}
        >
          <span className="min-w-0 flex-1 truncate">{tab.title}</span>
          <button
            aria-label="Close tab"
            className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] hover:bg-neutral-300"
            onClick={(event) => {
              event.stopPropagation();
              shell.closeTab(tab.id);
            }}
          >
            {tab.isDirty && (
              <span className="size-[6px] rounded-full bg-current group-hover:hidden" />
            )}
            <X
              className={cn(
                'size-[12px]',
                tab.isDirty
                  ? 'hidden group-hover:block'
                  : !tab.isActive && 'invisible group-hover:visible',
              )}
            />
          </button>
        </div>
      ))}
    </div>
    <button
      aria-label={t('home.newFile')}
      title={t('home.newFile')}
      className="mx-[4px] flex size-[28px] shrink-0 items-center justify-center self-center rounded-[4px] text-neutral-500 hover:bg-neutral-200 [-webkit-app-region:no-drag]"
      onClick={() => shell.newTab()}
    >
      <Plus className="size-[14px]" />
    </button>
  </div>
);
