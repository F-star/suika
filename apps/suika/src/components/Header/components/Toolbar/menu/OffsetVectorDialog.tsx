import { throttle } from '@suika/common';
import {
  offsetPathAndRecord,
  type OffsetPathJoin,
  type SuikaEditor,
  type SuikaGraphics,
  type SuikaPath,
  updateOffsetPath,
} from '@suika/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import NumberInput from '@/components/input/NumberInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DraggableDialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { type MessageIds } from '../../../../../locale';

interface OffsetVectorDialogProps {
  editor: SuikaEditor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OffsetPathSession {
  source: SuikaGraphics;
  path: SuikaPath;
}

export const OffsetVectorDialog = ({
  editor,
  open,
  onOpenChange,
}: OffsetVectorDialogProps) => {
  const intl = useIntl();
  const [offset, setOffset] = useState(20);
  const [join, setJoin] = useState<OffsetPathJoin>('MITER');
  const sessionRef = useRef<OffsetPathSession | null>(null);
  const t = (id: MessageIds) => intl.formatMessage({ id });

  const throttledUpdateOffset = useMemo(
    () =>
      throttle((nextOffset: number, nextJoin: OffsetPathJoin) => {
        const session = sessionRef.current;
        if (editor && session) {
          updateOffsetPath(editor, session.source, session.path, nextOffset, {
            join: nextJoin,
          });
        }
      }, 100),
    [editor],
  );

  useEffect(() => {
    return () => throttledUpdateOffset.cancel();
  }, [throttledUpdateOffset]);

  useEffect(() => {
    if (!editor || !open || sessionRef.current) return;

    const source = editor.selectedElements.getItems()[0];
    if (!source?.isSupportOffsetPath()) {
      onOpenChange(false);
      return;
    }

    const path = offsetPathAndRecord(editor, offset, { join });
    if (path) {
      sessionRef.current = { source, path };
    }
  }, [editor, join, offset, onOpenChange, open]);

  const updateOffset = (nextOffset: number, nextJoin = join) => {
    setOffset(nextOffset);
    throttledUpdateOffset(nextOffset, nextJoin);
  };

  const updateJoin = (nextJoin: OffsetPathJoin) => {
    setJoin(nextJoin);
    throttledUpdateOffset(offset, nextJoin);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      throttledUpdateOffset.flush();
      sessionRef.current = null;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DraggableDialogContent className="suika sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('offsetVector')}</DialogTitle>
        </DialogHeader>

        <label className="grid grid-cols-[6rem_1fr] items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {t('offsetVector.offset')}
          </span>
          <NumberInput
            value={offset}
            classNames={['!m-0', '!h-9', '!w-full']}
            onChange={updateOffset}
          />
        </label>

        <label className="grid grid-cols-[6rem_1fr] items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {t('offsetVector.join')}
          </span>
          <Select
            value={join}
            onValueChange={(value) => updateJoin(value as OffsetPathJoin)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MITER">
                {t('offsetVector.join.miter')}
              </SelectItem>
              <SelectItem value="ROUND">
                {t('offsetVector.join.round')}
              </SelectItem>
              <SelectItem value="BEVEL">
                {t('offsetVector.join.bevel')}
              </SelectItem>
            </SelectContent>
          </Select>
        </label>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t('cancel')}
          </DialogClose>
          <Button onClick={() => handleOpenChange(false)}>{t('apply')}</Button>
        </DialogFooter>
      </DraggableDialogContent>
    </Dialog>
  );
};
