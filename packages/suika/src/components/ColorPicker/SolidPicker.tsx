import { FC } from 'react';
import { SketchPicker } from 'react-color';
import { IRGBA } from '../../editor/texture';

interface IProps {
  color: IRGBA;
  onChange: (color: IRGBA) => void;
  onChangeComplete: (color: IRGBA) => void;
}

export const SolidPicker: FC<IProps> = ({ color, onChange, onChangeComplete }) => {
  const handleColor = (newColor: IRGBA) => {
    onChange(newColor);
  };

  return (
    <div>
      <SketchPicker
        color={color}
        onChange={(newColor) => {
          handleColor({ ...newColor.rgb, a: newColor.rgb.a || 1 });
        }}
        onChangeComplete={(newColor) => {
          const rgba = { ...newColor.rgb, a: newColor.rgb.a || 1 };
          handleColor(rgba);
          onChangeComplete(rgba);
        }}
      />
    </div>
  );
};
