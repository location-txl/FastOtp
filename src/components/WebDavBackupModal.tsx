import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Collapse,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  ApiOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  FileZipOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { WebdavBackupConfig, WebdavBackupItem } from '../custom';
import { messageRef } from '../App';

const { Text, Title, Paragraph } = Typography;

interface WebDavBackupModalProps {
  open: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
};

const formatSize = (bytes?: number) => {
  if (!bytes || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage) return maybeMessage;
  }
  return fallback;
};

const WebDavBackupModal: React.FC<WebDavBackupModalProps> = ({ open, onClose, onRestored }) => {
  const [form] = Form.useForm<WebdavBackupConfig>();
  const { modal } = App.useApp();
  const [testing, setTesting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backups, setBackups] = useState<WebdavBackupItem[]>([]);
  const [activeCollapse, setActiveCollapse] = useState<string[]>([]);

  const initialValues = useMemo<WebdavBackupConfig>(
    () => ({
      dirUrl: '',
      username: '',
      password: '',
      encryptPassword: '',
      retention: 0,
      allowInsecure: false,
    }),
    []
  );

  const refreshList = useCallback(async () => {
    setListLoading(true);
    try {
      // 尝试先验证表单，确保有配置
      // 如果只是刷新，可以尝试读取内存中的配置（通过 saveConfig 确保了这一步）
      const list = await window.api.backup.listWebdavBackups();
      setBackups(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      console.warn('获取列表失败:', e);
      // 如果是因为没配置导致的，静默失败或清空列表
      setBackups([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    try {
      const cfg = window.api.backup.getWebdavConfig();
      form.setFieldsValue({ ...initialValues, ...cfg });

      if (!cfg?.dirUrl) {
        // 如果没有配置 URL，默认展开配置面板
        setActiveCollapse(['config']);
        setBackups([]);
      } else {
        // 有配置，尝试刷新列表
        refreshList();
      }
    } catch (e: unknown) {
      messageRef.current?.error(getErrorMessage(e, '读取 WebDAV 配置失败'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const saveConfig = useCallback(async () => {
    const values = await form.validateFields();
    window.api.backup.setWebdavConfig(values);
    return values;
  }, [form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig();
      messageRef.current?.success('WebDAV 配置已保存');
    } catch (e: unknown) {
      messageRef.current?.error(getErrorMessage(e, '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await saveConfig();
      const res = await window.api.backup.testWebdavConnection();
      if (res.success) messageRef.current?.success(res.message);
      else messageRef.current?.error(res.message);
    } catch (e: unknown) {
      messageRef.current?.error(getErrorMessage(e, '测试失败'));
    } finally {
      setTesting(false);
    }
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      const cfg = await saveConfig();
      if (!cfg.encryptPassword) {
        messageRef.current?.error('请先设置“备份加密密码”');
        setActiveCollapse(['config']);
        return;
      }

      const res = await window.api.backup.createWebdavBackup();
      if (res.success) {
        messageRef.current?.success(res.filename ? `${res.message}：${res.filename}` : res.message);
        await refreshList();
      } else {
        messageRef.current?.error(res.message);
      }
    } catch (e: unknown) {
      messageRef.current?.error(getErrorMessage(e, '备份失败'));
    } finally {
      setBackingUp(false);
    }
  };

  const handleRefresh = async () => {
      try {
          await saveConfig();
          await refreshList();
      } catch (e) {
          messageRef.current?.error(getErrorMessage(e, '刷新失败'));
      }
  };

  const handleRestore = (item: WebdavBackupItem) => {
    if (import.meta.env.DEV) {
      console.debug('[WebDAV] 点击恢复:', item);
    }
    modal.confirm({
      title: '确认恢复',
      icon: <CloudDownloadOutlined style={{ color: '#faad14' }} />,
      content: (
        <div>
          <Paragraph>
            将用以下备份覆盖本地数据（活跃验证器 + 已删除列表）：
          </Paragraph>
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.06)' }}>
             <Space direction="vertical" size={0} style={{ width: '100%' }}>
                <Space>
                    <FileZipOutlined />
                    <Text strong style={{ wordBreak: 'break-all' }}>{item.filename}</Text>
                </Space>
                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatTime(item.createdAt)}
                    </Text>
                    {item.size && <Text type="secondary" style={{ fontSize: '12px' }}>{formatSize(item.size)}</Text>}
                </div>
             </Space>
          </div>
          <Paragraph type="warning" style={{ marginTop: 12, marginBottom: 0 }}>
             注意：恢复操作不可撤销，建议先备份当前数据。
          </Paragraph>
        </div>
      ),
      okText: '确认恢复',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          const cfg = await saveConfig();
          if (!cfg.encryptPassword) {
            messageRef.current?.error('请先设置“备份加密密码”');
            setActiveCollapse(['config']);
            return;
          }
          const res = await window.api.backup.restoreWebdavBackup(item.filename);
          if (res.success) {
            messageRef.current?.success(res.message);
            onRestored?.();
          } else {
            messageRef.current?.error(res.message);
          }
        } catch (e: unknown) {
          messageRef.current?.error(getErrorMessage(e, '恢复失败'));
        }
      },
    });
  };

  return (
    <Modal
      title={
        <Space>
            <CloudUploadOutlined />
            <span>WebDAV 云备份</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      styles={{ body: { padding: '16px 24px' } }}
    >
      <Collapse
        activeKey={activeCollapse}
        onChange={(keys) => setActiveCollapse(typeof keys === 'string' ? [keys] : keys)}
        ghost
        items={[
            {
                key: 'config',
                label: <Space><SettingOutlined /><span>连接配置</span></Space>,
                children: (
                    <Card size="small" bordered={false} style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <Form form={form} layout="vertical" initialValues={initialValues}>
                        <Form.Item
                        name="dirUrl"
                        label="WebDAV 目录 URL"
                        rules={[{ required: true, message: '请输入 URL' }]}
                        tooltip="例如：https://dav.box.com/dav/FastOtp/"
                        style={{ marginBottom: 12 }}
                        >
                        <Input placeholder="https://example.com/dav/FastOtp/" prefix={<ApiOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} />
                        </Form.Item>

                        <Space style={{ display: 'flex' }} size={16} align="start">
                            <Form.Item name="username" label="用户名" style={{ flex: 1, marginBottom: 12 }}>
                                <Input placeholder="可选" autoComplete="username" />
                            </Form.Item>
                            <Form.Item name="password" label="密码" style={{ flex: 1, marginBottom: 12 }}>
                                <Input.Password placeholder="可选" autoComplete="current-password" />
                            </Form.Item>
                        </Space>

                        <Space style={{ display: 'flex' }} size={16} align="start">
                            <Form.Item
                                name="encryptPassword"
                                label="备份加密密码"
                                style={{ flex: 1, marginBottom: 12 }}
                                tooltip="文件使用 AES-256 加密。请务必牢记此密码，否则无法恢复备份。"
                                rules={[{ required: true, message: '请设置加密密码' }]}
                            >
                                <Input.Password placeholder="用于加密备份文件" prefix={<SaveOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} />
                            </Form.Item>

                            <Form.Item
                                name="retention"
                                label="保留份数"
                                style={{ width: 120, marginBottom: 12 }}
                                tooltip="超过此数量的旧备份将被自动删除，0 为不限制"
                            >
                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Space>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Form.Item name="allowInsecure" valuePropName="checked" style={{ marginBottom: 0 }}>
                                <Space>
                                    <Switch size="small" />
                                    <Text type="secondary" style={{ fontSize: '13px' }}>允许不安全证书</Text>
                                </Space>
                            </Form.Item>

                            <Space>
                                <Button size="small" icon={<ApiOutlined />} onClick={handleTest} loading={testing}>
                                    测试连接
                                </Button>
                                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                                    保存配置
                                </Button>
                            </Space>
                        </div>
                    </Form>
                    </Card>
                )
            }
        ]}
      />

      <Divider style={{ margin: '16px 0' }} />

      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <Title level={5} style={{ margin: 0, fontSize: '15px' }}>备份列表</Title>
         <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh} loading={listLoading}>
                刷新
            </Button>
            <Button size="small" type="primary" icon={<CloudUploadOutlined />} onClick={handleBackupNow} loading={backingUp}>
                立即备份
            </Button>
         </Space>
      </div>

      <div style={{ height: '320px', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
        <List
            loading={listLoading}
            dataSource={backups}
            locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无备份" />
            }}
            renderItem={(item) => (
                <List.Item
                    actions={[
                        <Button
                            key="restore"
                            type="link"
                            size="small"
                            icon={<CloudDownloadOutlined />}
                            onClick={() => handleRestore(item)}
                        >
                            恢复
                        </Button>
                    ]}
                    style={{ padding: '10px 16px' }}
                >
                    <List.Item.Meta
                        avatar={<FileZipOutlined style={{ fontSize: '24px', color: '#1890ff', marginTop: 8 }} />}
                        title={
                             <Text style={{ fontSize: '14px' }}>{formatTime(item.createdAt)}</Text>
                        }
                        description={
                            <Space size={8} style={{ fontSize: '12px' }} wrap>
                                <Text type="secondary">{item.filename}</Text>
                                {item.size ? <Tag bordered={false} style={{ margin: 0 }}>{formatSize(item.size)}</Tag> : null}
                            </Space>
                        }
                    />
                </List.Item>
            )}
        />
      </div>
    </Modal>
  );
};

export default WebDavBackupModal;
