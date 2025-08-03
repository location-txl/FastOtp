import React from 'react';
import { Modal, Timeline, Typography, Tag, Space } from 'antd';
import { 
  BugOutlined, 
  StarOutlined, 
  ThunderboltOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { CHANGELOG_DATA, ChangelogEntry } from '../data/changelog';

const { Title, Text } = Typography;

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ open, onClose }) => {
  const renderChangelogSection = (
    title: string, 
    items: string[] | undefined, 
    color: string, 
    icon: React.ReactNode
  ) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div style={{ marginBottom: 16 }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          {icon}
          <Text strong style={{ color }}>{title}</Text>
        </Space>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {items.map((item, index) => (
            <li key={index}>
              <Text>{item}</Text>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderChangelogEntry = (entry: ChangelogEntry) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <Space align="center">
          <Tag color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
            v{entry.version}
          </Tag>
          <Text type="secondary">{entry.date}</Text>
        </Space>
      </div>
      
      {renderChangelogSection(
        '新功能', 
        entry.features, 
        '#52c41a', 
        <StarOutlined style={{ color: '#52c41a' }} />
      )}
      
      {renderChangelogSection(
        '改进优化', 
        entry.improvements, 
        '#1677ff', 
        <ThunderboltOutlined style={{ color: '#1677ff' }} />
      )}
      
      {renderChangelogSection(
        '问题修复', 
        entry.bugfixes, 
        '#ff4d4f', 
        <BugOutlined style={{ color: '#ff4d4f' }} />
      )}
      
      {renderChangelogSection(
        '破坏性变更', 
        entry.breaking, 
        '#fa8c16', 
        <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
      )}
    </div>
  );

  const timelineItems = CHANGELOG_DATA.map((entry, index) => ({
    color: index === 0 ? '#52c41a' : '#1677ff',
    children: renderChangelogEntry(entry)
  }));

  return (
    <Modal
      title={
        <Title level={3} style={{ margin: 0 }}>
          📋 更新日志
        </Title>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      style={{ top: 20 }}
      bodyStyle={{ 
        maxHeight: '70vh', 
        overflowY: 'auto',
        padding: '20px 24px'
      }}
    >
      <Timeline 
        items={timelineItems}
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

export default ChangelogModal;