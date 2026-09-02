import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { type MessageIds } from '../locale';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface IProps {
  value: number;
  onClearCanvas: () => void;
  clearCanvasHintDelay: number;
}

export const ProgressOverlay = ({
  value,
  onClearCanvas,
  clearCanvasHintDelay,
}: IProps) => {
  const intl = useIntl();
  const [visible, setVisible] = useState(true);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [showClearCanvasHint, setShowClearCanvasHint] = useState(false);

  const t = (id: MessageIds) => intl.formatMessage({ id });

  useEffect(() => {
    if (value >= 100) {
      setDisplayProgress(100);
      setTimeout(() => {
        setVisible(false);
      }, 150);
    }
  }, [value]);

  useEffect(() => {
    if (value >= 100) {
      setShowClearCanvasHint(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowClearCanvasHint(true);
    }, clearCanvasHintDelay);

    return () => window.clearTimeout(timeout);
  }, [clearCanvasHintDelay, value]);

  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress < 100) {
        // slow start, fast end
        const progressRatio = currentProgress / 100;
        const increment = progressRatio * progressRatio * 5 + 1;
        currentProgress = Math.min(95, currentProgress + increment);
        setDisplayProgress(Math.max(Math.floor(currentProgress), value));
      } else {
        clearInterval(interval);
      }
    }, 80);

    return () => {
      clearInterval(interval);
    };
  }, [value]);

  return (
    <div
      style={{ display: visible ? '' : 'none' }}
      className="fixed inset-0 flex items-center justify-center z-100 bg-[#e6e6e6]"
    >
      <div className="relative w-[200px]">
        <Progress value={displayProgress} className="mx-auto w-[60%]" />
        {showClearCanvasHint && (
          <p className="absolute left-0 top-full mt-3 w-full text-center text-xs text-muted-foreground">
            {t('loadingFailedHintPrefix')}
            <Button
              variant="link"
              size="sm"
              className="h-auto px-1 text-xs"
              onClick={onClearCanvas}
            >
              {t('clearCanvasAndRefresh')}
            </Button>
          </p>
        )}
      </div>
    </div>
  );
};
