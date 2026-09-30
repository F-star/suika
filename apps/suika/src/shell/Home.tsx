import { FileText, FolderOpen, Plus } from 'lucide-react';
import { type FC, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { type RecentFile, type ShellService } from '../lib/shell-service';
import { type MessageIds, type SupportedLocale } from '../locale';

interface IProps {
  shell: ShellService;
  locale: SupportedLocale;
  t: (id: MessageIds) => string;
}

export const Home: FC<IProps> = ({ shell, locale, t }) => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>();

  useEffect(() => {
    const refresh = () => shell.getRecentFiles().then(setRecentFiles);
    refresh();
    return shell.onRecentFilesChange(refresh);
  }, [shell]);

  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <div className="mx-auto max-w-[720px] px-[24px] py-[40px]">
        <div className="flex gap-[8px]">
          <Button size="sm" onClick={() => shell.newTab()}>
            <Plus />
            {t('home.newFile')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => shell.openFile()}>
            <FolderOpen />
            {t('import.originFile')}
          </Button>
        </div>

        <h2 className="mb-[8px] mt-[32px] text-xs font-medium text-neutral-500">
          {t('home.recentFiles')}
        </h2>
        {recentFiles?.length === 0 && (
          <p className="py-[16px] text-xs text-neutral-400">
            {t('home.noRecentFiles')}
          </p>
        )}
        <ul>
          {recentFiles?.map((file) => (
            <li key={file.path}>
              <button
                title={file.path}
                className="flex w-full items-center gap-[12px] rounded-[6px] px-[8px] py-[8px] text-left hover:bg-neutral-100"
                onClick={() => shell.openRecentFile(file.path)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  shell.showRecentFileMenu(file.path);
                }}
              >
                <FileText className="size-[16px] shrink-0 text-neutral-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-neutral-900">
                    {file.name}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">
                    {file.directory}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {dateFormat.format(file.openedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
