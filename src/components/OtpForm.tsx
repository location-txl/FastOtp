import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { DEFAULT_OTP_PERIOD, DEFAULT_OTP_DIGITS, DEFAULT_OTP_ALGORITHM, DEFAULT_OTP_TYPE } from '../constants';
import { OtpItem } from '../custom';

interface OtpFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (values: OtpItem) => void;
  editItem?: OtpItem | null;
}

interface OtpFormValues {
  id?: string;
  name: string;
  issuer?: string;
  secret: string;
  remark?: string;
  type: 'totp';
  algorithm: 'SHA1';
  digits: 6;
  period: 30;
}

const OtpForm: React.FC<OtpFormProps> = ({ visible, onClose, onSave, editItem }) => {
  const [form] = Form.useForm<OtpFormValues>();

  useEffect(() => {
    if (visible && editItem) {
      form.setFieldsValue(editItem as OtpFormValues);
    } else if (visible) {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        type: DEFAULT_OTP_TYPE,
        algorithm: DEFAULT_OTP_ALGORITHM,
        digits: DEFAULT_OTP_DIGITS,
        period: DEFAULT_OTP_PERIOD
      });
    }
  }, [visible, editItem, form]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      // 强制设置固定值
      values.type = DEFAULT_OTP_TYPE;
      values.algorithm = DEFAULT_OTP_ALGORITHM;
      values.digits = DEFAULT_OTP_DIGITS;
      values.period = DEFAULT_OTP_PERIOD;
      
      const item = editItem ? { ...editItem, ...values } : values;
      onSave(item as OtpItem);
      form.resetFields();
    });
  };

  return (
    <Modal
      title={editItem ? "编辑验证器" : "添加新验证器"}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          保存
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="例如：个人邮箱、GitHub" />
        </Form.Item>

        <Form.Item
          name="issuer"
          label="服务提供商"
        >
          <Input placeholder="例如：Google、Microsoft、GitHub" />
        </Form.Item>

        <Form.Item
          name="secret"
          label="密钥"
          rules={[{ required: true, message: '请输入密钥' }]}
        >
          <Input.TextArea 
            placeholder="JBSW Y3DP EHPK 3PXP"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea 
            placeholder="请输入备注信息"
            rows={3}
          />
        </Form.Item>
        
        {/* 隐藏字段 - 运行时设置 */}
        <Form.Item name="type" hidden initialValue="totp" />
        <Form.Item name="algorithm" hidden initialValue="SHA1" />
        <Form.Item name="digits" hidden initialValue={6} />
        <Form.Item name="period" hidden initialValue={30} />
      </Form>
    </Modal>
  );
};

export default OtpForm; 