import { type SuikaEditor } from '@suika/core';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import NumberInput from '@/components/input/NumberInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { type MessageIds } from '../../../../../locale';

interface NudgeAmountDialogProps {
  editor: SuikaEditor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NudgeAmountDialog = ({
  editor,
  open,
  onOpenChange,
}: NudgeAmountDialogProps) => {
  const intl = useIntl();
  const [smallNudge, setSmallNudge] = useState(1);
  const [bigNudge, setBigNudge] = useState(10);

  const t = (id: MessageIds) => intl.formatMessage({ id });

  useEffect(() => {
    if (!editor || !open) return;

    setSmallNudge(editor.setting.get('smallNudge'));
    setBigNudge(editor.setting.get('bigNudge'));
  }, [editor, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="suika sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('nudgeAmount')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('nudgeAmount.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <label className="grid grid-cols-[6rem_1fr] items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {t('nudgeAmount.small')}
            </span>
            <NumberInput
              value={smallNudge}
              min={0.1}
              max={999999999}
              classNames={['!m-0', '!h-9', '!w-full']}
              onChange={(value) => {
                setSmallNudge(value);
                editor?.setting.set('smallNudge', value);
              }}
            />
          </label>

          <label className="grid grid-cols-[6rem_1fr] items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {t('nudgeAmount.big')}
            </span>
            <NumberInput
              value={bigNudge}
              min={1}
              max={999999999}
              classNames={['!m-0', '!h-9', '!w-full']}
              onChange={(value) => {
                setBigNudge(value);
                editor?.setting.set('bigNudge', value);
              }}
            />
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
};
