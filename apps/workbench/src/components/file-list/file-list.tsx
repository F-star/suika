import 'dayjs/locale/zh-cn';

import { EllipsisOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Dropdown, Input, Modal, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FC, useState } from 'react';
import { useIntl } from 'react-intl';

import { FileItem } from '../../type';
import styles from './file-list.module.less';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

interface Props {
  items: FileItem[];
  activeFileIds: number[];
  onDeleteFile(ids: number[]): void;
  onRenameFile(id: number, newName: string): void;
  setActiveFileIds(ids: number[]): void;
  onClickFile(id: number): void;
}

export const FileList: FC<Props> = (props) => {
  const intl = useIntl();

  const columns: ColumnsType = [
    {
      title: intl.formatMessage({ id: 'form.field.name' }),
      dataIndex: 'title',
      key: 'name',
    },
    {
      title: intl.formatMessage({ id: 'form.field.lastModified' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: '25%',
    },
    {
      title: intl.formatMessage({ id: 'form.field.createdAt' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '25%',
    },
    {
      key: 'action',
      width: '60px',
      render: (_, record: FileItem) => {
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  label: intl.formatMessage({ id: 'action.rename' }),
                  key: 'rename',
                },
                {
                  label: intl.formatMessage({ id: 'action.delete' }),
                  key: 'delete',
                },
              ],
              onClick: ({ key }) => {
                if (key === 'rename') {
                  openRenameConfirmModal(record);
                } else if (key === 'delete') {
                  openDeleteConfirmModal(record);
                }
              },
            }}
          >
            <div
              style={{
                float: 'right',
              }}
            >
              <Button type="text" icon={<EllipsisOutlined />} />
            </div>
          </Dropdown>
        );
      },
    },
  ];

  const [toDeleteFile, setToDeleteFile] = useState<FileItem | null>(null);
  const openDeleteConfirmModal = (record: FileItem) => {
    setToDeleteFile(record);
  };

  const [toRenameFile, setToRenameFile] = useState<FileItem | null>(null);
  const [newFilename, setNewFilename] = useState('');

  const openRenameConfirmModal = (record: FileItem) => {
    setToRenameFile(record);
    setNewFilename(record.title);
  };

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            Table: {
              headerBg: '#fff',
              headerSplitColor: 'none',
              borderColor: 'none',
              headerColor: '#666',
              rowHoverBg: 'none',
            },
            Button: {
              paddingInline: 4,
            },
          },
        }}
      >
        <Table
          dataSource={props.items.map((item) => ({
            ...item,
            createdAt: dayjs(item.createdAt).fromNow(),
            updatedAt: dayjs(item.updatedAt).fromNow(),
          }))}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          onRow={(record) => {
            return {
              className: props.activeFileIds.includes(record.id)
                ? styles.activeRow
                : '',
              onClick: () => props.setActiveFileIds([record.id]),
              onDoubleClick: () => props.onClickFile(record.id),
            };
          }}
        ></Table>
      </ConfigProvider>
      {/* delete */}
      <Modal
        title={intl.formatMessage({ id: 'deleteFile' })}
        open={Boolean(toDeleteFile)}
        okText="confirm"
        cancelText="cancel"
        transitionName=""
        onOk={() => {
          if (!toDeleteFile) {
            return;
          }
          props.onDeleteFile([toDeleteFile.id]);
          setToDeleteFile(null);
        }}
        onCancel={() => setToDeleteFile(null)}
      >
        <div style={{ padding: '16px 0' }}>
          will delete <b>{toDeleteFile?.title}</b>, this action cannot be undone
        </div>
      </Modal>
      {/* rename */}
      <Modal
        title="rename file"
        open={Boolean(toRenameFile)}
        okText="confirm"
        cancelText="cancel"
        transitionName=""
        onOk={() => {
          if (!toRenameFile) {
            return;
          }
          props.onRenameFile(toRenameFile.id, newFilename);
          setToRenameFile(null);
        }}
        onCancel={() => setToRenameFile(null)}
      >
        <div style={{ padding: '16px 0' }}>
          <Input
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
};
