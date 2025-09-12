import React, { useState } from 'react';
import { Button, Tooltip, Modal, Form, Input, Space, Switch, Divider, Typography } from 'antd';
import { SettingOutlined, QuestionCircleOutlined, CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { messageRef } from '../App';

interface WebDavSettingsProps {
  onAfterRestore?: () => void;
  onCloseFocus?: () => void;
  canBackup?: boolean;
}

const WebDavSettings: React.FC<WebDavSettingsProps> = ({ onAfterRestore, onCloseFocus, canBackup = true }) => {
  const [visible, setVisible] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [form] = Form.useForm();

  const openSettings = () => {
    try {
      const cfg = window.api.otp.getWebDavConfig();
      const autoConfig = window.api.otp.getAutoBackupConfig();
      
      form.setFieldsValue({
        url: cfg.url || '',
        username: cfg.username || '',
        password: '',
        remotePath: cfg.remotePath || '/FastOtp/backup.txt'
      });
      setHasPassword(!!cfg.hasPassword);
      setAutoBackupEnabled(autoConfig.enabled);
      setLastBackupAt(autoConfig.lastBackupAt);
      setVisible(true);
    } catch (e) {
      console.error('加载 WebDAV 配置失败:', e);
      if (messageRef.current) messageRef.current.error('加载 WebDAV 配置失败');
    }
  };

  const handleSaveConfig = async () => {
    try {
      const values = await form.validateFields();
      const res = window.api.otp.saveWebDavConfig(values);
      if (res.success) {
        setVisible(false);
        if (messageRef.current) messageRef.current.success(res.message);
        setTimeout(() => {
          if (onCloseFocus) onCloseFocus();
        }, 100);
      } else {
        if (messageRef.current) messageRef.current.error(res.message);
      }
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return; // 表单校验错误
      console.error('保存 WebDAV 配置失败:', e);
      if (messageRef.current) messageRef.current.error('保存 WebDAV 配置失败');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // 先验证表单，获取当前输入的配置
      const values = await form.validateFields();
      
      // 构建测试配置，如果密码为空且hasPassword为true，则需要提示
      const testConfig = {
        url: values.url,
        username: values.username,
        password: values.password,
        remotePath: values.remotePath
      };
      
      // 如果密码为空且之前有密码，提示用户
      if (!values.password && hasPassword) {
        if (messageRef.current) messageRef.current.warning('密码为空，将使用已保存的密码进行测试');
        // 使用已保存的配置进行测试
        const res = await window.api.otp.testWebDavConnection();
        if (res.success) {
          if (messageRef.current) messageRef.current.success('WebDAV 连接成功');
        } else {
          if (messageRef.current) messageRef.current.error(res.message);
        }
      } else {
        // 使用当前表单配置进行测试
        const res = await window.api.otp.testWebDavConnection(testConfig);
        if (res.success) {
          if (messageRef.current) messageRef.current.success('WebDAV 连接成功');
        } else {
          if (messageRef.current) messageRef.current.error(res.message);
        }
      }
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) {
        if (messageRef.current) messageRef.current.error('请先完善配置信息');
        return;
      }
      console.error('测试 WebDAV 连接失败:', e);
      if (messageRef.current) messageRef.current.error('测试连接失败');
    } finally {
      setTesting(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await window.api.otp.webdavBackup();
      if (res.success) {
        if (messageRef.current) messageRef.current.success('已备份到 WebDAV');
        if (window.utools) {
          window.utools.showNotification('FastOtp 已备份到 WebDAV');
        }
      } else {
        if (messageRef.current) messageRef.current.error(res.message);
      }
    } catch (e) {
      console.error('WebDAV 备份失败:', e);
      if (messageRef.current) messageRef.current.error('备份失败');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await window.api.otp.webdavRestore();
      if (res.success) {
        if (messageRef.current) messageRef.current.success(`从 WebDAV 恢复成功，导入 ${res.imported} 个`);
        if (onAfterRestore) onAfterRestore();
      } else {
        const msg = res.errors && res.errors.length > 0 ? res.errors[0] : '恢复失败';
        if (messageRef.current) messageRef.current.error(msg);
      }
    } catch (e) {
      console.error('WebDAV 恢复失败:', e);
      if (messageRef.current) messageRef.current.error('恢复失败');
    } finally {
      setRestoring(false);
    }
  };

  const handleAutoBackupToggle = (checked: boolean) => {
    try {
      const res = window.api.otp.setAutoBackupEnabled(checked);
      if (res.success) {
        setAutoBackupEnabled(checked);
        if (messageRef.current) {
          messageRef.current.success(checked ? '已启用自动备份' : '已禁用自动备份');
        }
      } else {
        if (messageRef.current) messageRef.current.error(res.message || '设置失败');
      }
    } catch (e) {
      console.error('设置自动备份失败:', e);
      if (messageRef.current) messageRef.current.error('设置失败');
    }
  };

  return (
    <>
      <Tooltip title="WebDAV 设置">
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={openSettings}
          size="small"
        />
      </Tooltip>

      <Modal
        title="WebDAV 设置"
        open={visible}
        onCancel={() => {
          setVisible(false);
          setTimeout(() => {
            if (onCloseFocus) onCloseFocus();
          }, 100);
        }}
        onOk={handleSaveConfig}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ url: '', username: '', password: '', remotePath: '/FastOtp/backup.txt' }}
        >
          <Form.Item
            label="WebDAV 地址"
            name="url"
            rules={[{ required: true, message: '请输入 WebDAV 服务地址' }]}
          >
            <Input placeholder="https://example.com/dav" />
          </Form.Item>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item
            label={hasPassword ? '密码（留空不变）' : '密码'}
            name="password"
          >
            <Input.Password placeholder={hasPassword ? '留空表示不修改' : '请输入密码'} />
          </Form.Item>
          <Form.Item
            label="远程路径"
            name="remotePath"
            rules={[{ required: true, message: '请输入远程文件路径' }]}
          >
            <Input placeholder="/FastOtp/backup.txt" />
          </Form.Item>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Typography.Text strong>自动备份</Typography.Text>
              <Switch
                checked={autoBackupEnabled}
                onChange={handleAutoBackupToggle}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
            <Typography.Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              启用后，每次修改验证器配置都会自动备份到 WebDAV
            </Typography.Text>
            {lastBackupAt && (
              <Typography.Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                最后备份时间：{new Date(lastBackupAt).toLocaleString('zh-CN')}
              </Typography.Text>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Button onClick={handleTestConnection} loading={testing} icon={<QuestionCircleOutlined />}>测试连接</Button>
            <Space>
              <Button onClick={handleBackup} disabled={!canBackup} loading={backingUp} icon={<CloudUploadOutlined />}>备份到 WebDAV</Button>
              <Button onClick={handleRestore} loading={restoring} icon={<CloudDownloadOutlined />}>从 WebDAV 恢复</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default WebDavSettings;


