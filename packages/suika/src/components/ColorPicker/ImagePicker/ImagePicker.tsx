import './ImagePicker.scss';

import { DEFAULT_IMAGE_SRC } from '@suika/core';
import { useMount } from 'ahooks';
import { FC, useRef } from 'react';
import { FormattedMessage } from 'react-intl';

interface IProps {
  value: string;
  onChange: (src: string) => void;
}
export const ImagePicker: FC<IProps> = ({ value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useMount(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // only image

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setTimeout(() => {
          onChange(src);
        });
      };
      reader.readAsDataURL(file);
    };

    fileInputRef.current = fileInput;
  });

  return (
    <div className="suika-image-picker">
      <div className="suika-img-content">
        <img className="suika-img-preview" src={value || DEFAULT_IMAGE_SRC} />
        <div className="suika-img-choose-btn-wrapper">
          <button
            className="suika-img-choose-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FormattedMessage id="uploadFile" />
          </button>
        </div>
      </div>
    </div>
  );
};
