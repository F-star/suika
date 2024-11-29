import './PaintPicker.scss';

import { Select } from '@suika/components';
import { DEFAULT_PAINTS, type IPaint, PaintType } from '@suika/core';
import { CloseOutlined } from '@suika/icons';
import { type FC } from 'react';
import { useIntl } from 'react-intl';

import { ImagePicker } from '../ImagePicker';
import { SolidPicker } from '../SolidPicker';

interface IProps {
  paint: IPaint;
  onChange: (paint: IPaint) => void;
  onChangeComplete: (color: IPaint) => void;
  onClose?: () => void;
}

const intlIdMap = {
  [PaintType.Solid]: 'paintType.solid',
  [PaintType.Image]: 'paintType.image',
} as const;

export const PaintPicker: FC<IProps> = ({
  paint,
  onChange,
  onChangeComplete,
  onClose,
}) => {
  const intl = useIntl();

  const options = [
    {
      value: PaintType.Solid,
      label: intl.formatMessage({ id: intlIdMap[PaintType.Solid] }),
    },
    {
      value: PaintType.Image,
      label: intl.formatMessage({ id: intlIdMap[PaintType.Image] }),
    },
  ];

  return (
    <div className="suika-paint-picker">
      <div className="paint-picker-header">
        <Select
          value={paint.type}
          options={options}
          onSelect={(val) => onChange(DEFAULT_PAINTS[val as PaintType])}
        />
        <div
          className="suika-close-btn"
          onClick={() => {
            onClose && onClose();
          }}
        >
          <CloseOutlined />
        </div>
      </div>

      {/* SOLID */}
      {paint.type === PaintType.Solid && (
        <SolidPicker
          color={paint.attrs}
          onChange={(newColor) => {
            onChange({ type: PaintType.Solid, attrs: newColor, visible: true });
          }}
          onChangeComplete={(color) => {
            onChangeComplete({
              type: PaintType.Solid,
              attrs: color,
              visible: true,
            });
          }}
        />
      )}
      {/* IMAGE */}
      {paint.type === PaintType.Image && (
        <ImagePicker
          value={paint.attrs.src || ''}
          onChange={(src) => {
            onChangeComplete({
              type: PaintType.Image,
              attrs: { src },
              visible: true,
            });
          }}
        />
      )}
    </div>
  );
};
