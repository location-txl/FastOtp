import React from 'react';
import { Button, Empty, List, Space, Tag, Typography } from 'antd';
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  FileZipOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { WebdavBackupItem } from '../../custom';
import { formatSize, formatTime } from './format';

const { Text, Title } = Typography;

type WebDavBackupListSectionProps = {
  backups: WebdavBackupItem[];
  listLoading: boolean;
  backingUp: boolean;
  onRefresh: () => void;
  onBackupNow: () => void;
  onRestore: (item: WebdavBackupItem) => void;
};

const WebDavBackupListSection: React.FC<WebDavBackupListSectionProps> = ({
  backups,
  listLoading,
  backingUp,
  onRefresh,
  onBackupNow,
  onRestore,
}) => {
  return (
    <>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={5} style={{ margin: 0, fontSize: '15px' }}>
          备份列表
        </Title>
        <Space>
          <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} loading={listLoading}>
            刷新
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={onBackupNow}
            loading={backingUp}
          >
            立即备份
          </Button>
        </Space>
      </div>

      <div
        style={{
          height: '320px',
          overflowY: 'auto',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '8px',
          background: 'rgba(0,0,0,0.01)',
        }}
      >
        <List
          loading={listLoading}
          dataSource={backups}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无备份" /> }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="restore"
                  type="link"
                  size="small"
                  icon={<CloudDownloadOutlined />}
                  onClick={() => onRestore(item)}
                >
                  恢复
                </Button>,
              ]}
              style={{ padding: '10px 16px' }}
            >
              <List.Item.Meta
                avatar={<FileZipOutlined style={{ fontSize: '24px', color: '#1890ff', marginTop: 8 }} />}
                title={<Text style={{ fontSize: '14px' }}>{formatTime(item.createdAt)}</Text>}
                description={
                  <Space size={8} style={{ fontSize: '12px' }} wrap>
                    <Text type="secondary">{item.filename}</Text>
                    {item.size ? (
                      <Tag bordered={false} style={{ margin: 0 }}>
                        {formatSize(item.size)}
                      </Tag>
                    ) : null}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </>
  );
};

export default WebDavBackupListSection;
