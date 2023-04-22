import { FC } from 'react';
import { SolidPicker } from '../SolidPicker';
import { ITexture, TextureType } from '../../../editor/texture';
import './TexturePicker.scss';
import { FormattedMessage } from 'react-intl';
import { CloseOutlined } from '@suika/icons';

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
  return (
    <div className="texture-picker">
      <div className="texture-picker-header">
        <FormattedMessage id={intlIdMap[texture.type]} />
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
      {texture.type === TextureType.Image && <div>TODO: Image Picker</div>}
    </div>
  );
};
