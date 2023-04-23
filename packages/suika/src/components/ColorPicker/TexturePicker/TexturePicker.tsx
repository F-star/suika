import { FC, useState } from 'react';
import { SolidPicker } from '../SolidPicker';
import { ITexture, TextureType } from '../../../editor/texture';
import './TexturePicker.scss';
import { CloseOutlined } from '@suika/icons';
import { Select } from '@suika/components';
import { useIntl } from 'react-intl';

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

  const [value, setValue] = useState(texture.type); // TODO: just test, replace it plz

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
          value={value}
          options={options}
          onSelect={(val) => setValue(val as TextureType)}
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
      {texture.type === TextureType.Image && <div>TODO: Image Picker</div>}
    </div>
  );
};
