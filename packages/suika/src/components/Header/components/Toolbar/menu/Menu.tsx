import { Dropdown } from '@suika/components';
import { FC, useContext } from 'react';
import { useIntl } from 'react-intl';
import { exportService, importService } from '../../../../../editor';
import { EditorContext } from '../../../../../context';
import { MenuOutlined } from '@suika/icons';
import './menu.scss';

export const Menu: FC = () => {
  const intl = useIntl();
  const editor = useContext(EditorContext);

  const items = [
    {
      key: 'import',
      label: intl.formatMessage({ id: 'import.originFile' }),
    },
    {
      key: 'export',
      label: intl.formatMessage({ id: 'export.originFile' }),
    },
  ];

  const handleClick = ({ key }: { key: string }) => {
    if (!editor) return;
    if (key === 'import') {
      importService.importOriginFile(editor);
    } else if (key === 'export') {
      exportService.exportOriginFile(editor);
    }
  };

  return (
    <Dropdown items={items} onClick={handleClick}>
      <div className="sk-ed-menu-btn">
        <MenuOutlined />
      </div>
    </Dropdown>
  );
};
