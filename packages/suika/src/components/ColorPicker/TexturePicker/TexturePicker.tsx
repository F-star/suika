import { FC } from 'react';
import { SolidPicker } from '../SolidPicker';
import { ITexture, TextureType, DEFAULT_TEXTURES } from '@suika/core';
import './TexturePicker.scss';
import { CloseOutlined } from '@suika/icons';
import { Select } from '@suika/components';
import { useIntl } from 'react-intl';
import { ImagePicker } from '../ImagePicker';

interface IProps {
  texture: ITexture;
  onChange: (texture: ITexture) => void;
  onChangeComplete: (color: ITexture) => void;
  onClose?: () => void;
}

const intlIdMap = {
  [TextureType.Solid]: 'textureType.solid',
  [TextureType.Image]: 'textureType.image',
} as const;

export const TexturePicker: FC<IProps> = ({
  texture,
  onChange,
  onChangeComplete,
  onClose,
}) => {
  const intl = useIntl();

  const options = [
    {
      value: TextureType.Solid,
      label: intl.formatMessage({ id: intlIdMap[TextureType.Solid] }),
    },
    {
      value: TextureType.Image,
      label: intl.formatMessage({ id: intlIdMap[TextureType.Image] }),
    },
  ];

  return (
    <div className="suika-texture-picker">
      <div className="texture-picker-header">
        <Select
          value={texture.type}
          options={options}
          onSelect={(val) => onChange(DEFAULT_TEXTURES[val as TextureType])}
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
      {texture.type === TextureType.Solid && (
        <SolidPicker
          color={texture.attrs}
          onChange={(newColor) => {
            onChange({ type: TextureType.Solid, attrs: newColor });
          }}
          onChangeComplete={(color) => {
            onChangeComplete({ type: TextureType.Solid, attrs: color });
          }}
        />
      )}
      {/* IMAGE */}
      {texture.type === TextureType.Image && (
        <ImagePicker
          value={texture.attrs.src || ''}
          onChange={(src) => {
            onChangeComplete({ type: TextureType.Image, attrs: { src } });
          }}
        />
      )}
    </div>
  );
};
