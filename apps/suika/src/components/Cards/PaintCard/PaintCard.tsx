import './PaintCard.scss';

import {
  arrMapRevert,
  parseHexToRGB,
  parseRGBAStr,
  parseRGBToHex,
} from '@suika/common';
import { IconButton, Popover } from '@suika/components';
import {
  DEFAULT_IMAGE_SRC,
  type IPaint,
  type IRGBA,
  type PaintSolid,
  PaintType,
} from '@suika/core';
import {
  AddOutlined,
  HideOutlined,
  RemoveOutlined,
  ShowOutlined,
} from '@suika/icons';
import { type FC, useState } from 'react';

import { PaintPicker } from '../../ColorPicker/PaintPicker';
import { ColorHexInput } from '../../input/ColorHexInput';
import { PercentInput } from '../../input/PercentInput';
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
  paints: IPaint[];
  onChange: (fill: IPaint, index: number) => void;
  onChangeComplete: (fill: IPaint, index: number) => void;

  onDelete: (index: number) => void;
  onAdd: () => void;
  onToggleVisible: (index: number) => void;

  appendedContent?: React.ReactNode;
}

export const PaintCard: FC<IProps> = ({
  title,
  paints,
  onChange,
  onChangeComplete,

  onDelete,
  onAdd,
  onToggleVisible,

  appendedContent,
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const pickerPopover = (
    <PaintPicker
      paint={paints[activeIndex]}
      onClose={() => {
        setActiveIndex(-1);
      }}
      onChange={(tex) => onChange(tex, activeIndex)}
      onChangeComplete={(tex) => onChangeComplete(tex, activeIndex)}
    />
  );

  if (paints.length == 0) {
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
          {arrMapRevert(paints, (paint, index) => {
            /** SOLID **/
            if (paint.type === PaintType.Solid) {
              return (
                <div className="fill-item" key={index}>
                  <div className="fill-item-left">
                    <ColorHexInput
                      prefix={
                        <div
                          className="color-block"
                          style={{
                            backgroundColor: parseRGBAStr(paint.attrs),
                            boxShadow: isNearWhite(paint.attrs)
                              ? '0 0 0 1px rgba(0,0,0,0.1) inset'
                              : undefined,
                          }}
                          onMouseDown={() => {
                            setActiveIndex(index);
                          }}
                        />
                      }
                      value={parseRGBToHex(paint.attrs)}
                      classNames={[paint.visible === false ? 'disabled' : '']}
                      onChange={(newHex) => {
                        const rgb = parseHexToRGB(newHex);

                        if (rgb) {
                          const newSolidPaint: PaintSolid = {
                            type: PaintType.Solid,
                            attrs: {
                              ...rgb,
                              a: paint.attrs.a,
                            },
                            visible: true,
                          };
                          onChangeComplete(newSolidPaint, index);
                        }
                      }}
                    />
                    {/* alpha input */}
                    <PercentInput
                      classNames={[
                        'paint-card-alpha-input',
                        paint.visible === false ? 'disabled' : '',
                      ]}
                      value={paint.attrs.a}
                      min={0}
                      max={1}
                      onChange={(val) => {
                        onChangeComplete(
                          {
                            ...paint,
                            attrs: {
                              ...paint.attrs,
                              a: val,
                            },
                          },
                          index,
                        );
                      }}
                    />
                  </div>
                  <div className="suika-paint-card-actions">
                    <IconButton onClick={() => onToggleVisible(index)}>
                      {paint.visible === false ? (
                        <HideOutlined />
                      ) : (
                        <ShowOutlined />
                      )}
                    </IconButton>
                    <IconButton onClick={() => onDelete(index)}>
                      <RemoveOutlined />
                    </IconButton>
                  </div>
                </div>
              );
            }

            /** IMAGE */
            if (paint.type === PaintType.Image) {
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
                        backgroundImage: `url(${paint.attrs.src})`,
                        objectFit: 'contain',
                        width: '100%',
                        height: '100%',
                      }}
                      alt="img"
                      src={paint.attrs.src || DEFAULT_IMAGE_SRC}
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
