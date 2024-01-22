import './TextureCard.scss';

import {
  arrMapRevert,
  parseHexToRGB,
  parseRGBAStr,
  parseRGBToHex,
} from '@suika/common';
import { IconButton, Popover } from '@suika/components';
import {
  DEFAULT_IMAGE_SRC,
  IRGBA,
  ITexture,
  TextureSolid,
  TextureType,
} from '@suika/core';
import { AddOutlined, RemoveOutlined } from '@suika/icons';
import { FC, useState } from 'react';

import { TexturePicker } from '../../ColorPicker/TexturePicker';
import { ColorHexInput } from '../../input/ColorHexInput';
import { BaseCard } from '../BaseCard';

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
  onChange: (fill: ITexture, index: number) => void;
  onChangeComplete: (fill: ITexture, index: number) => void;

  onDelete: (index: number) => void;
  onAdd: () => void;

  appendedContent?: React.ReactNode;
}

export const TextureCard: FC<IProps> = ({
  title,
  textures,
  onChange,
  onChangeComplete,

  onDelete,
  onAdd,

  appendedContent,
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const pickerPopover = (
    <TexturePicker
      texture={textures[activeIndex]}
      onClose={() => {
        setActiveIndex(-1);
      }}
      onChange={(tex) => onChange(tex, activeIndex)}
      onChangeComplete={(tex) => onChangeComplete(tex, activeIndex)}
    />
  );

  if (textures.length == 0) {
    return (
      <BaseCard
        title={title}
        headerAction={
          <IconButton
            onClick={() => {
              onAdd();
            }}
          >
            <AddOutlined />
          </IconButton>
        }
      >
        {/* TODO: different types with empty and different types with filled */}
        <></>
      </BaseCard>
    );
  }

  return (
    <Popover
      open={activeIndex >= 0}
      onOpenChange={(val) => {
        if (!val) {
          setActiveIndex(-1);
        }
      }}
      content={activeIndex >= 0 && pickerPopover}
      placement="left-start"
      offset={2}
    >
      <div>
        <BaseCard
          title={title}
          headerAction={
            <IconButton onClick={onAdd}>
              <AddOutlined />
            </IconButton>
          }
        >
          {arrMapRevert(textures, (texture, index) => {
            /** SOLID **/
            if (texture.type === TextureType.Solid) {
              return (
                <div className="fill-item" key={index}>
                  <ColorHexInput
                    prefix={
                      <div
                        className="color-block"
                        style={{
                          backgroundColor: parseRGBAStr(texture.attrs),
                          boxShadow: isNearWhite(texture.attrs)
                            ? '0 0 0 1px rgba(0,0,0,0.1) inset'
                            : undefined,
                        }}
                        onMouseDown={() => {
                          setActiveIndex(index);
                        }}
                      />
                    }
                    value={parseRGBToHex(texture.attrs)}
                    onBlur={(newHex) => {
                      const rgb = parseHexToRGB(newHex);

                      if (rgb) {
                        const newSolidTexture: TextureSolid = {
                          type: TextureType.Solid,
                          attrs: {
                            ...rgb,
                            a: texture.attrs.a,
                          },
                        };
                        onChangeComplete(newSolidTexture, index);
                      }
                    }}
                  />
                  <IconButton onClick={() => onDelete(index)}>
                    <RemoveOutlined />
                  </IconButton>
                </div>
              );
            }

            /** IMAGE */
            if (texture.type === TextureType.Image) {
              return (
                <div className="fill-item" key={index}>
                  <div
                    className="img-block"
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
                  <IconButton onClick={() => onDelete(index)}>
                    <RemoveOutlined />
                  </IconButton>
                </div>
              );
            }
          })}
          {appendedContent}
        </BaseCard>
      </div>
    </Popover>
  );
};
