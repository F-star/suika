import { FC } from 'react';
import { parseRGBAStr, parseRGBToHex } from '../../../utils/color';
import { BaseCard } from '../BaseCard';
import './TextureCard.scss';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  DEFAULT_IMAGE_SRC,
  IRGBA,
  ITexture,
  TextureType,
} from '../../../editor/texture';
import { TexturePicker } from '../../ColorPicker/TexturePicker';
import { Popover } from '@suika/components';

const isNearWhite = (rgba: IRGBA, threshold = 85) => {
  const { r, g, b } = rgba;

  const dist = Math.sqrt(
    Math.pow(r - 255, 2) + Math.pow(g - 255, 2) + Math.pow(b - 255, 2),
  );
  return dist < threshold;
};

interface IProps {
  title: string;
  textures: ITexture[];
  onChange: (fill: ITexture) => void;
  onChangeComplete: (fill: ITexture) => void;

  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export const TextureCard: FC<IProps> = ({
  title,
  textures,
  activeIndex,
  setActiveIndex,
  onChange,
  onChangeComplete,
}) => {
  const intl = useIntl();

  const pickerPopover = (
    <TexturePicker
      texture={textures[activeIndex]}
      onClose={() => {
        setActiveIndex(-1);
      }}
      onChange={onChange}
      onChangeComplete={onChangeComplete}
    />
  );

  if (textures.length == 0) {
    return (
      <BaseCard title={title}>
        <div style={{ marginLeft: 16 }}>
          <FormattedMessage id="mixed" />
        </div>
      </BaseCard>
    );
  }

  return (
    <Popover
      open={activeIndex >= 0}
      content={activeIndex >= 0 && pickerPopover}
      placement="left-start"
    >
      <BaseCard title={intl.formatMessage({ id: 'fill' })}>
        {textures.map((texture, index) => {
          /** SOLID **/
          if (texture.type === TextureType.Solid) {
            return (
              <div className="fill-item" key={index}>
                <div
                  className="color-block"
                  style={{
                    backgroundColor: parseRGBAStr(texture.attrs),
                    boxShadow: isNearWhite(texture.attrs)
                      ? '0 0 0 1px rgba(0,0,0,0.1) inset'
                      : undefined,
                  }}
                  onClick={() => {
                    setActiveIndex(index);
                  }}
                />
                {parseRGBToHex(texture.attrs)}
              </div>
            );
          }
          /** IMAGE */
          if (texture.type === TextureType.Image) {
            return (
              <div className="fill-item" key={index}>
                <div
                  className="color-block"
                  onClick={() => {
                    setActiveIndex(index);
                  }}
                >
                  <img
                    style={{
                      backgroundImage: `url(${texture.attrs.src})`,
                      objectFit: 'contain',
                      width: '100%',
                      height: '100%',
                    }}
                    alt="img"
                    src={texture.attrs.src || DEFAULT_IMAGE_SRC}
                  />
                </div>
              </div>
            );
          }
        })}
      </BaseCard>
    </Popover>
  );
};
