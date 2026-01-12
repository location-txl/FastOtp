import React, { useState, useEffect, useCallback } from 'react';
import { Card, Progress, Typography, Space, theme, Button, Modal } from 'antd';
import { DeleteOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { messageRef } from '../App';
import { OtpItem } from '../custom';
import { DEFAULT_OTP_PERIOD } from '../constants';

const { Text, Title } = Typography;
const { useToken } = theme;
const REMARK_LEN = 20

interface OtpCardProps {
  item: {
    id: string;
    name: string;
    secret: string;
    issuer?: string;
    remark?: string;
    digits?: number;
    period?: number;
    algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  };
  index: number;
  onDelete: (id: string) => void;
  onEdit: (item: OtpItem) => void;
  isSelected?: boolean;
  onOtpGenerated?: (otp: string) => void;
  timeLeft: number; // 从父组件传入的计时器时间
  refreshKey: number; // 用于触发OTP刷新的计数器
}

const OtpCard: React.FC<OtpCardProps> = ({ 
  item, 
  index, 
  onDelete, 
  onEdit, 
  isSelected = false, 
  onOtpGenerated,
  timeLeft,
  refreshKey
}) => {
  const [otp, setOtp] = useState('');
  const [nextOtp, setNextOtp] = useState(''); // 新增状态：存储下一个OTP
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const period = item.period || DEFAULT_OTP_PERIOD;
  const { token } = useToken();

  // 使用useCallback包装生成OTP的函数，避免重复创建
  const generateOtp = useCallback(() => {
    try {
      const options = {
        digits: item.digits,
        period: item.period,
        algorithm: item.algorithm,
      };
      //  api类型在custom.d.ts中定义
      const newOtp = window.api.otp.generateTOTP(item.secret, options);
      const newNextOtp = window.api.otp.generateNextTOTP(item.secret, options); // 生成下一个OTP
      console.log("newOtp", newOtp)
      console.log("newNextOtp", newNextOtp)
      setOtp(newOtp);
      setNextOtp(newNextOtp); // 更新下一个OTP状态
    } catch (error) {
      console.error('生成OTP失败:', error);
      setOtp('错误');
    }
  }, [item.secret, item.digits, item.period, item.algorithm]);

  // 当otp值变化时，通知父组件
  useEffect(() => {
    if (onOtpGenerated && otp) {
      onOtpGenerated(otp);
    }
  }, [otp, onOtpGenerated]);

  // 初始生成OTP
  useEffect(() => {
    // 组件挂载时初始生成OTP
    generateOtp();
  }, [generateOtp]);

  // 当refreshKey变化时刷新OTP
  useEffect(() => {
    if (refreshKey > 0) { // 确保不是初始值
      generateOtp();
    }
  }, [refreshKey, generateOtp]);

  const copyCurrentOtp = useCallback(() => {
    if (otp) {
      window.api.otp.copyToClipboard(otp);
      
      // 使用自定义消息组件
      if (messageRef.current) {
        messageRef.current.success('当前验证码已复制到剪贴板');
      } else {
        console.log('当前验证码已复制: ' + otp);
      }
    } else {
      if (messageRef.current) {
        messageRef.current.error('验证码不可用');
      }
    }
  }, [otp]);

  const copyNextOtp = useCallback(() => {
    if (nextOtp) {
      window.api.otp.copyToClipboard(nextOtp);
      
      // 使用自定义消息组件
      if (messageRef.current) {
        messageRef.current.success('下一个验证码已复制到剪贴板');
      } else {
        console.log('下一个验证码已复制: ' + nextOtp);
      }
    } else {
      if (messageRef.current) {
        messageRef.current.error('下一个验证码不可用');
      }
    }
  }, [nextOtp]);

  // 支持快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Command + 数字键 (1-9)
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        const keyNum = parseInt(e.key);
        if (keyNum === index + 1) {
          copyCurrentOtp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [index, copyCurrentOtp]);

  // 适配深色模式的颜色计算
  const selectedBgColor = isSelected ? token.colorPrimaryBg : undefined;
  const nextOtpColor = token.colorTextSecondary;

  return (
    <Card
      title={
        <Space>
          {item.issuer && <Text strong>{item.issuer}</Text>}
          <Text>{item.name}</Text>
          {index < 9 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              (Ctrl/⌘+{index + 1})
            </Text>
          )}
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              onEdit(item);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              onDelete(item.id);
            }}
          />
        </Space>
      }
      style={{ 
        marginBottom: 10,
        backgroundColor: selectedBgColor,
        width: '100%',
        border: isSelected ? `1px solid ${token.colorPrimary}` : undefined,
        cursor: 'pointer', // 添加指针样式表明可点击
      }}
      size="small"
      styles={{
        body: {
          transition: 'all 0.3s',
          padding: '8px 16px',
        },
        header: { padding: '0 16px' },
      }}
      onClick={copyCurrentOtp} // 添加点击事件
    >
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}> 
            <div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '0px' }}>当前验证码</Text>
              <Title 
                level={3} 
                style={{ 
                  fontFamily: 'monospace', 
                  letterSpacing: '0.3em', 
                  margin: 0, 
                  lineHeight: 1,
                  cursor: 'pointer' 
                }}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡，防止触发卡片的点击事件
                  copyCurrentOtp();
                }}
              >
                {otp}
              </Title>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '0px' }}>下一个</Text>
              <Text 
                type="secondary" 
                style={{ 
                  fontFamily: 'monospace', 
                  letterSpacing: '0.2em', 
                  fontSize: '1.2em',
                  lineHeight: 1,
                  color: nextOtpColor,
                  marginBottom: '0px',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡，防止触发卡片的点击事件
                  copyNextOtp();
                }}
              >
                {nextOtp}
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}> 
            <Progress 
              percent={(timeLeft / period) * 100} 
              showInfo={false}
              strokeColor={isSelected ? token.colorPrimary : undefined}
              style={{ flex: 1, marginRight: '8px' }}
              size="small"
            />
            <Text style={{ whiteSpace: 'nowrap' }}>
              {timeLeft}秒后刷新
            </Text>
          </div>
        </div>
      </div>
      {item.remark && (
        <div style={{ marginTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px', verticalAlign: 'middle' }}>
            {item.remark.length > REMARK_LEN ? `${item.remark.substring(0, REMARK_LEN)}...` : item.remark}
          </Text>
          {item.remark.length > REMARK_LEN && (
            <Button
              icon={<InfoCircleOutlined />}
              size="small"
              type="text"
              style={{ verticalAlign: 'middle', padding: '0 4px' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowRemarkModal(true);
              }}
            />
          )}
        </div>
      )}
      {item.remark && (
        <Modal
          title="备注信息"
          open={showRemarkModal}
          onCancel={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            setShowRemarkModal(false);
          }}
          footer={null}
          maskClosable={true}
          style={{ pointerEvents: 'auto' }}
        >
        <div onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', margin: 0 }}>
              {item.remark}
            </pre>
          </div>
        </Modal>
      )}
    </Card>
  );
};

// 使用React.memo包装组件，避免不必要的重渲染
export default React.memo(OtpCard); 
