import { useIntl } from 'react-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { type MessageIds } from '../locale';

interface IProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClearCanvasDialog = ({ open, onOpenChange }: IProps) => {
  const intl = useIntl();
  const t = (id: MessageIds) => intl.formatMessage({ id });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="suika z-[200] sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('clearCanvas.confirm.title')}</DialogTitle>
          <DialogDescription>
            {t('clearCanvas.confirm.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              localStorage.removeItem('suika-paper');
              window.location.reload();
            }}
          >
            {t('clearCanvas.confirm.action')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
