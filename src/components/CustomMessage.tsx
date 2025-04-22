import  { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { Alert } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';

// 定义消息类型
type MessageType = 'success' | 'info' | 'warning' | 'error';

// 消息配置
interface MessageConfig {
  content: string;
  type: MessageType;
  duration?: number;
  id: number;
}

// 导出的接口定义
export interface CustomMessageRef {
  success: (content: string, duration?: number) => void;
  info: (content: string, duration?: number) => void;
  warning: (content: string, duration?: number) => void;
  error: (content: string, duration?: number) => void;
}

// 默认持续时间（毫秒）
const DEFAULT_DURATION = 3000;

// 获取消息图标
const getIcon = (type: MessageType) => {
  switch (type) {
    case 'success':
      return <CheckCircleOutlined />;
    case 'info':
      return <InfoCircleOutlined />;
    case 'warning':
      return <WarningOutlined />;
    case 'error':
      return <CloseCircleOutlined />;
    default:
      return null;
  }
};

const CustomMessage = forwardRef<CustomMessageRef>((_, ref) => {
  const [messages, setMessages] = useState<MessageConfig[]>([]);
  const [messageId, setMessageId] = useState(0);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    success: (content, duration) => addMessage(content, 'success', duration),
    info: (content, duration) => addMessage(content, 'info', duration),
    warning: (content, duration) => addMessage(content, 'warning', duration),
    error: (content, duration) => addMessage(content, 'error', duration)
  }));

  // 添加消息
  const addMessage = (content: string, type: MessageType, duration: number = DEFAULT_DURATION) => {
    const id = messageId;
    setMessageId(id + 1);
    
    const newMessage: MessageConfig = {
      content,
      type,
      duration,
      id
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // 设置自动移除
    if (duration > 0) {
      setTimeout(() => {
        removeMessage(id);
      }, duration);
    }
  };

  // 移除消息
  const removeMessage = (id: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  // 创建消息容器
  useEffect(() => {
    if (!document.getElementById('custom-message-container')) {
      const container = document.createElement('div');
      container.id = 'custom-message-container';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.zIndex = '1000';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }
  }, []);

  // 渲染消息
  return createPortal(
    <>
      {messages.map(msg => (
        <div 
          key={msg.id}
          style={{ 
            maxWidth: '80vw',
            marginBottom: '8px',
            animation: 'fadeInDown 0.3s'
          }}
        >
          <Alert
            message={msg.content}
            type={msg.type}
            showIcon
            icon={getIcon(msg.type)}
            closable
            onClose={() => removeMessage(msg.id)}
            style={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              borderRadius: '4px'
            }}
          />
        </div>
      ))}
      <style>
        {`
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>,
    document.getElementById('custom-message-container') || document.body
  );
});

export default CustomMessage; 