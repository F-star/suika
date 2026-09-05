import { offsetPathAndRecord, type SuikaEditor } from '@suika/core';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import NumberInput from '@/components/input/NumberInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { type MessageIds } from '../../../../../locale';

interface OffsetVectorDialogProps {
  editor: SuikaEditor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OffsetVectorDialog = ({
  editor,
  open,
  onOpenChange,
}: OffsetVectorDialogProps) => {
  const intl = useIntl();
  const [offset, setOffset] = useState(20);
  const t = (id: MessageIds) => intl.formatMessage({ id });

  const applyOffset = () => {
    if (editor && offsetPathAndRecord(editor, offset)) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="suika sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('offsetVector')}</DialogTitle>
        </DialogHeader>

        <label className="grid grid-cols-[6rem_1fr] items-center gap-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {t('offsetVector.offset')}
          </span>
          <NumberInput
            value={offset}
            classNames={['!m-0', '!h-9', '!w-full']}
            onChange={setOffset}
          />
        </label>

        <DialogFooter>
          <DialogClose>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button onClick={applyOffset}>{t('apply')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
