import { useEffect, useState } from 'react';

import { Progress } from './ui/progress';

interface IProps {
  value: number;
}

export const ProgressOverlay = ({ value }: IProps) => {
  const [visible, setVisible] = useState(true);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (value >= 100) {
      setDisplayProgress(100);
      setTimeout(() => {
        setVisible(false);
      }, 150);
    }
  }, [value]);

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
      <div className="w-[200px]">
        <Progress value={displayProgress} className="w-[60%]" />
      </div>
    </div>
  );
};
