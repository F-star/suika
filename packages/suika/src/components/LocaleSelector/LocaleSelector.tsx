import { FC, useState } from 'react';
import './LocaleSelector.scss';
import {
  autoUpdate,
  offset,
  useClick,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import classNames from 'classnames';
import { useClickAway } from 'ahooks';
import store from 'store2';
import { appEventEmitter } from '../../events';
import { I18n } from '@suika/icons';

export const LocaleSelector: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    middleware: [offset(12)],
    whileElementsMounted: autoUpdate,
  });
  const click = useClick(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click]);

  useClickAway(
    () => {
      setIsOpen(false);
    },
    [refs.domReference, refs.floating],
    'mousedown'
  );

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className={classNames('locale-selector', { active: isOpen })}
      >
        <I18n />
      </div>
      {isOpen && (
        <div
          ref={refs.setFloating}
          className="locale-selector-popover"
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            zIndex: 20,
          }}
          {...getFloatingProps()}
        >
          <div
            className="locale-selector-popover-item"
            onClick={() => {
              const en = 'en';
              store.set('suika-locale', en);
              appEventEmitter.emit('localeChange', en);
              setIsOpen(false);
            }}
          >
            English
          </div>
          <div
            className="locale-selector-popover-item"
            onClick={() => {
              const zh = 'zh';
              store.set('suika-locale', zh);
              appEventEmitter.emit('localeChange', zh);
              setIsOpen(false);
            }}
          >
            简体中文
          </div>
        </div>
      )}
    </>
  );
};
