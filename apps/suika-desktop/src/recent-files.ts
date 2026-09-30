import { EventEmitter } from 'node:events';
import { access, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { app } from 'electron';

const MAX_RECENT_FILES = 30;

interface RecentFileRecord {
  path: string;
  openedAt: number;
}

export interface RecentFile extends RecentFileRecord {
  name: string;
  /** Parent directory, with the home directory shortened to `~`. */
  directory: string;
}

const emitter = new EventEmitter();
let records: RecentFileRecord[] | undefined;
let pendingWrite = Promise.resolve();

const getStorePath = () =>
  path.join(app.getPath('userData'), 'recent-files.json');

const load = async () => {
  if (!records) {
    try {
      records = JSON.parse(await readFile(getStorePath(), 'utf8'));
    } catch {
      records = [];
    }
  }
  return records!;
};

const update = (next: RecentFileRecord[]) => {
  records = next.slice(0, MAX_RECENT_FILES);
  const content = JSON.stringify(records);
  // Serialize writes so an older list never overwrites a newer one.
  pendingWrite = pendingWrite
    .then(() => writeFile(getStorePath(), content, 'utf8'))
    .catch((error) => console.error('Failed to save recent files', error));
  emitter.emit('change');
};

export const addRecentFile = async (filePath: string) => {
  const current = await load();
  update([
    { path: filePath, openedAt: Date.now() },
    ...current.filter((record) => record.path !== filePath),
  ]);
  app.addRecentDocument(filePath);
};

export const removeRecentFile = async (filePath: string) => {
  const current = await load();
  update(current.filter((record) => record.path !== filePath));
};

export const isRecentFile = async (filePath: string) =>
  (await load()).some((record) => record.path === filePath);

/** Lists recent files, most recent first. Files that no longer exist are dropped. */
export const listRecentFiles = async (): Promise<RecentFile[]> => {
  const current = await load();
  const exists = await Promise.all(
    current.map((record) =>
      access(record.path).then(
        () => true,
        () => false,
      ),
    ),
  );
  const existing = current.filter((_, index) => exists[index]);
  if (existing.length !== current.length) {
    const missing = new Set(
      current.filter((_, index) => !exists[index]).map((record) => record.path),
    );
    // Filter the latest list: files may have been added while checking.
    update((await load()).filter((record) => !missing.has(record.path)));
  }

  const home = os.homedir();
  return existing.map((record) => {
    const directory = path.dirname(record.path);
    return {
      ...record,
      name: path.basename(record.path),
      directory: directory.startsWith(home)
        ? `~${directory.slice(home.length)}`
        : directory,
    };
  });
};

export const onRecentFilesChange = (listener: () => void) => {
  emitter.on('change', listener);
};
