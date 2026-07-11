import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Card, Modal, Progress, QRCode, Space, Tooltip, Typography, theme } from 'antd';
import { DeleteOutlined, EditOutlined, InfoCircleOutlined, ShareAltOutlined } from '@ant-design/icons';
import { messageRef } from '../App';
import { OtpItem } from '../custom';
import { DEFAULT_OTP_PERIOD } from '../constants';

const { Text, Title } = Typography;
const { useToken } = theme;
const REMARK_LEN = 20

interface OtpCardProps {
  item: OtpItem;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (item: OtpItem) => void;
  isSelected?: boolean;
  onOtpGenerated?: (otp: string) => void;
  timeLeft: number; // 从父组件传入的计时器时间
  refreshKey: number; // 用于触发OTP刷新的计数器
  isGrid?: boolean;
}

const OtpCard: React.FC<OtpCardProps> = ({ 
  item, 
  index, 
  onDelete, 
  onEdit, 
  isSelected = false, 
  onOtpGenerated,
  timeLeft,
  refreshKey,
  isGrid = false
}) => {
  const [otp, setOtp] = useState('');
  const [nextOtp, setNextOtp] = useState(''); // 新增状态：存储下一个OTP
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUri, setShareUri] = useState('');
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

  const handleShare = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    try {
      const uri = window.api.otp.generateOtpUri(item, { includeRemark: false });
      setShareUri(uri);
      setShowShareModal(true);
    } catch (error) {
      console.error('生成分享二维码失败:', error);
      messageRef.current?.error('生成分享二维码失败');
    }
  }, [item]);

  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
    setShareUri('');
  }, []);

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
      className={`otp-card${isGrid ? ' otp-card--grid' : ''}`}
      title={
        <Space size={6} className="otp-card-title">
          {item.issuer && <Text strong ellipsis={isGrid}>{item.issuer}</Text>}
          <Text ellipsis={isGrid}>{item.name}</Text>
          {!isGrid && index < 9 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              (Ctrl/⌘+{index + 1})
            </Text>
          )}
        </Space>
      }
      extra={
        <Space size={isGrid ? 2 : 8}>
          <Button
            icon={<EditOutlined />}
            size="small"
            type={isGrid ? 'text' : 'default'}
            aria-label="编辑验证器"
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              onEdit(item);
            }}
          />
          <Tooltip title="分享密钥">
            <Button
              icon={<ShareAltOutlined />}
              size="small"
              type={isGrid ? 'text' : 'default'}
              aria-label="分享密钥"
              onClick={handleShare}
            />
          </Tooltip>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            type={isGrid ? 'text' : 'default'}
            aria-label="删除验证器"
            danger
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              onDelete(item.id);
            }}
          />
        </Space>
      }
      style={{ 
        marginBottom: isGrid ? 0 : 10,
        backgroundColor: selectedBgColor,
        width: '100%',
        height: isGrid ? '100%' : undefined,
        border: isSelected ? `1px solid ${token.colorPrimary}` : undefined,
        cursor: 'pointer', // 添加指针样式表明可点击
      }}
      size="small"
      styles={{
        body: {
          transition: 'all 0.3s',
          padding: isGrid ? '10px 12px' : '8px 16px',
        },
        header: { padding: isGrid ? '0 12px' : '0 16px' },
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
      <Modal
        title="分享验证器"
        open={showShareModal}
        onCancel={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          closeShareModal();
        }}
        footer={null}
        maskClosable={true}
      >
        <div
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          <div style={{ textAlign: 'center' }}>
            <Text strong style={{ display: 'block' }}>{item.issuer || '未知发行方'}</Text>
            <Text type="secondary">{item.account || item.name}</Text>
          </div>
          {shareUri && (
            <div style={{ padding: 12, backgroundColor: '#fff', borderRadius: token.borderRadiusLG }}>
              <QRCode value={shareUri} size={220} bordered={false} errorLevel="M" />
            </div>
          )}
          <Text type="secondary">请使用其他验证器扫描二维码导入</Text>
          <Alert
            type="warning"
            showIcon
            message="二维码包含登录密钥，请勿截图或发送给不可信的人"
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
    </Card>
  );
};

// 使用React.memo包装组件，避免不必要的重渲染
export default React.memo(OtpCard); 
