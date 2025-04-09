import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { ApiService } from '../../api-service';
import { FileList } from '../../components/file-list';
import { FileItem } from '../../type';
import styles from './files-page.module.less';

export const FilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFileIds, setActiveFileIds] = useState<number[]>([]);

  const onCreateFile = async () => {
    const file = await ApiService.createFile('new file');
    fetchFiles();
    openFile(file.data.id);
  };

  const fetchFiles = () => {
    ApiService.getFileList().then((res) => {
      setFiles(res.data);
    });
  };

  const onDeleteFile = async (ids: number[]) => {
    await ApiService.deleteFiles(ids);
    fetchFiles();
  };

  const onRenameFile = async (id: number, newVal: string) => {
    await ApiService.updateFile(id, { title: newVal });
    fetchFiles();
  };

  const openFile = (id: number) => {
    console.log('click file', id);
    window.open(`/design/${id}`);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div>
      <div className={styles.fileHeader}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateFile}>
          <FormattedMessage id={'createNew'} />
        </Button>
      </div>
      <FileList
        items={files}
        activeFileIds={activeFileIds}
        onDeleteFile={onDeleteFile}
        onRenameFile={onRenameFile}
        onClickFile={openFile}
        setActiveFileIds={setActiveFileIds}
      />
    </div>
  );
};
