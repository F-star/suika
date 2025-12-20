import {
  type ILetterSpacing,
  MutateGraphsAndRecord,
  SuikaText,
} from '@suika/core';
import { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { LetterSpacingInput } from '@/components/input/LetterSpacingInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FONT_FILES } from '@/constant';

import { EditorContext } from '../../../context';
import NumberInput from '../../input/NumberInput';
import { BaseCard } from '../BaseCard';

export const TypographyCard = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });

  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Smiley Sans');

  const [hasTextSelected, setHasTextSelected] = useState(false);

  const [letterSpacingUnit, setLetterSpacingUnit] = useState<ILetterSpacing>({
    value: 0,
    units: 'PERCENT',
  });
  const [isLetterSpacingMixed, setIsLetterSpacingMixed] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const updateFontInfo = () => {
      const items = editor.selectedElements.getItems();

      let _fontSize: number | string | undefined;
      let _fontFamily: string | undefined;
      let _hasTextSelected = false;
      for (const item of items) {
        if (item instanceof SuikaText) {
          _hasTextSelected = true;
          const fontSize = item.attrs.fontSize;
          if (_fontSize === undefined) {
            _fontSize = fontSize;
          } else if (_fontSize !== fontSize) {
            _fontSize = MIXED;
            break;
          }
        }
      }

      for (const item of items) {
        if (item instanceof SuikaText) {
          const fontFamily = item.attrs.fontFamily;
          if (_fontFamily === undefined) {
            _fontFamily = fontFamily;
          } else if (_fontFamily !== fontFamily) {
            _fontFamily = MIXED;
            break;
          }
        }
      }

      let _letterSpacing: ILetterSpacing | undefined;
      let _isLetterSpacingMixed = false;
      for (const item of items) {
        if (item instanceof SuikaText) {
          const letterSpacing = item.attrs.letterSpacing;
          if (_letterSpacing === undefined) {
            _letterSpacing = letterSpacing;
          } else if (
            _letterSpacing.value !== letterSpacing.value ||
            _letterSpacing.units !== letterSpacing.units
          ) {
            _isLetterSpacingMixed = true;
            _letterSpacing = { value: 0, units: 'PERCENT' };
            break;
          }
        }
      }

      setFontSize(_fontSize as number);
      setFontFamily(_fontFamily as string);
      setHasTextSelected(_hasTextSelected);
      setLetterSpacingUnit(_letterSpacing ?? { value: 0, units: 'PERCENT' });
      setIsLetterSpacingMixed(_isLetterSpacingMixed);
    };

    updateFontInfo(); // init

    editor.sceneGraph.on('render', updateFontInfo);
  }, [editor, MIXED]);

  const execUpdateFontSizeCommand = (value: number) => {
    if (!editor) return;
    const items = editor.selectedElements.getItems();
    MutateGraphsAndRecord.setFontSize(editor, items, value);
    editor.render();
  };

  const execUpdateFontFamilyCommand = (value: string) => {
    if (!editor) return;
    const items = editor.selectedElements.getItems();
    MutateGraphsAndRecord.setFontFamily(editor, items, value);
    editor.render();
  };

  const execUpdateLetterSpacingCommand = (value: ILetterSpacing) => {
    if (!editor) return;
    const items = editor.selectedElements.getItems();
    MutateGraphsAndRecord.setLetterSpacing(editor, items, value);
    editor.render();
  };

  if (!hasTextSelected) {
    return null;
  }

  return (
    <BaseCard title={intl.formatMessage({ id: 'typography' })}>
      <div className="mx-2">
        <div className="mx-[4px] mb-2">
          <Select
            value={fontFamily}
            onValueChange={execUpdateFontFamilyCommand}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {Object.keys(FONT_FILES).map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
              <SelectItem className="hidden" value={MIXED}>
                Mixed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex ">
          <div>
            <div className="mx-[4px] mb-1 text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'fontSize' })}
            </div>
            <NumberInput
              value={fontSize}
              min={1}
              max={100}
              onIncrement={() => execUpdateFontSizeCommand(fontSize + 1)}
              onDecrement={() => {
                if (fontSize - 1 < 1) return;
                execUpdateFontSizeCommand(fontSize - 1);
              }}
              onChange={execUpdateFontSizeCommand}
            />
          </div>
          <div className="mx-[4px] mb-2">
            <div className="mb-1 text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'letterSpacing' })}
            </div>
            <LetterSpacingInput
              className="w-[100px]"
              value={letterSpacingUnit.value}
              unit={letterSpacingUnit.units}
              mixed={isLetterSpacingMixed}
              onChange={(value, unit) => {
                execUpdateLetterSpacingCommand({ value, units: unit });
              }}
            />
          </div>
        </div>
      </div>
    </BaseCard>
  );
};
