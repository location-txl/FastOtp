import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, InputNumber, List, Modal, Space, Switch, Tooltip, Typography } from 'antd';
import { CloudDownloadOutlined, CloudUploadOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import type { WebdavBackupConfig, WebdavBackupItem } from '../custom';
import { messageRef } from '../App';

const { Text } = Typography;

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
  const [testing, setTesting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backups, setBackups] = useState<WebdavBackupItem[]>([]);

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

  useEffect(() => {
    if (!open) return;
    try {
      const cfg = window.api.backup.getWebdavConfig();
      form.setFieldsValue({ ...initialValues, ...cfg });
      if (cfg?.dirUrl) {
        setTimeout(() => {
          refreshList();
        }, 0);
      } else {
        setBackups([]);
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

  const refreshList = useCallback(async () => {
    setListLoading(true);
    try {
      await saveConfig();
      const list = await window.api.backup.listWebdavBackups();
      setBackups(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      messageRef.current?.error(getErrorMessage(e, '获取备份列表失败'));
    } finally {
      setListLoading(false);
    }
  }, [saveConfig]);

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      const cfg = await saveConfig();
      if (!cfg.encryptPassword) {
        messageRef.current?.error('请先设置“备份加密密码”（仅本地保存）');
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

  const handleRestore = (item: WebdavBackupItem) => {
    Modal.confirm({
      title: '确认恢复',
      content: (
        <div>
          <div>将用以下备份覆盖本地数据（活跃验证器 + 已删除列表）：</div>
          <div style={{ marginTop: 8 }}>
            <Text code>{formatTime(item.createdAt)}</Text>
          </div>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">{item.filename}</Text>
          </div>
        </div>
      ),
      okText: '恢复',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          const cfg = await saveConfig();
          if (!cfg.encryptPassword) {
            messageRef.current?.error('请先设置“备份加密密码”（仅本地保存）');
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
      title="WebDAV 备份"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button key="save" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          保存设置
        </Button>,
      ]}
      width={760}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="dirUrl"
          label="WebDAV 目录 URL"
          rules={[{ required: true, message: '请输入 WebDAV 目录 URL（以 http(s) 开头）' }]}
          extra="示例：https://example.com/dav/FastOtp/（目录不存在会尝试创建）"
        >
          <Input placeholder="https://example.com/dav/FastOtp/" />
        </Form.Item>

        <Space style={{ display: 'flex' }} size={12} align="start">
          <Form.Item name="username" label="用户名" style={{ flex: 1 }}>
            <Input placeholder="可留空（匿名）" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" style={{ flex: 1 }}>
            <Input.Password placeholder="可留空" autoComplete="current-password" />
          </Form.Item>
        </Space>

        <Space style={{ display: 'flex' }} size={12} align="start">
          <Form.Item
            name="encryptPassword"
            label="备份加密密码"
            style={{ flex: 1 }}
            extra="仅保存在本地；备份文件为“AES-256 加密 ZIP”。建议用 FastOtp 恢复；外部解压请用 7-Zip/WinZip（部分系统自带解压工具/Windows 资源管理器不支持）。忘记密码将无法恢复。"
          >
            <Input.Password placeholder="建议设置一个独立密码" />
          </Form.Item>

          <Form.Item
            name="retention"
            label="保留份数"
            style={{ width: 180 }}
            extra="0 表示不自动清理"
          >
            <InputNumber min={0} max={500} style={{ width: '100%' }} />
          </Form.Item>
        </Space>

        <Form.Item name="allowInsecure" valuePropName="checked">
          <Tooltip title="仅在自签名证书等场景使用，不推荐">
            <Switch /> <Text style={{ marginLeft: 8 }}>允许不安全 HTTPS 证书</Text>
          </Tooltip>
        </Form.Item>
      </Form>

      <Space style={{ marginTop: 8 }} wrap>
        <Button onClick={handleTest} loading={testing}>
          测试连接
        </Button>
        <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleBackupNow} loading={backingUp}>
          立即备份
        </Button>
        <Button icon={<ReloadOutlined />} onClick={refreshList} loading={listLoading}>
          刷新列表
        </Button>
        <Text type="secondary">恢复需要从列表中选择备份</Text>
      </Space>

      <div style={{ marginTop: 16 }}>
        <List
          loading={listLoading}
          dataSource={backups}
          locale={{ emptyText: '暂无备份（先配置并点击“立即备份”）' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="restore"
                  icon={<CloudDownloadOutlined />}
                  onClick={() => handleRestore(item)}
                >
                  恢复
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={formatTime(item.createdAt)}
                description={
                  <Space size={8} wrap>
                    <Text type="secondary">{item.filename}</Text>
                    {item.size ? <Text type="secondary">· {formatSize(item.size)}</Text> : null}
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
