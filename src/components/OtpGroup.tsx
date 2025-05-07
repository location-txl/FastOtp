import { Avatar, Radio, Space, RadioChangeEvent } from "antd";
import { OtpItem } from "../custom";
import { AppstoreOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState, useRef } from "react";

interface OtpGroupProps {
  otpItems: OtpItem[];
  onSelectIssuer: (otpItems: OtpItem[]) => void;
}

const getIssuerIcon = (issuer: string) => {
  // 这里可以扩展为实际的图标匹配逻辑
  // 例如: 常见服务提供商的图标映射
  const iconMap: Record<string, React.ReactNode> = {
    'Google': <Avatar src="https://www.google.com/favicon.ico" size="small" />,
    'Microsoft': <Avatar src="https://www.microsoft.com/favicon.ico" size="small" />,
    'Github': <Avatar src="https://github.com/favicon.ico" size="small" />,
    'Apple': <Avatar src="https://www.apple.com/favicon.ico" size="small" />,
    'Amazon': <Avatar src="https://www.amazon.com/favicon.ico" size="small" />,
    'Facebook': <Avatar src="https://www.facebook.com/favicon.ico" size="small" />,
    'Twitter': <Avatar src="https://twitter.com/favicon.ico" size="small" />,
    // 添加更多常见服务提供商的图标
    'Dropbox': <Avatar src="https://www.dropbox.com/favicon.ico" size="small" />,
    'LinkedIn': <Avatar src="https://www.linkedin.com/favicon.ico" size="small" />,
    'Netflix': <Avatar src="https://www.netflix.com/favicon.ico" size="small" />,
    'PayPal': <Avatar src="https://www.paypal.com/favicon.ico" size="small" />,
    'Slack': <Avatar src="https://slack.com/favicon.ico" size="small" />,
    'Instagram': <Avatar src="https://www.instagram.com/favicon.ico" size="small" />,
    'Twitch': <Avatar src="https://www.twitch.tv/favicon.ico" size="small" />,
    'Discord': <Avatar src="https://discord.com/favicon.ico" size="small" />,
    'Gitlab': <Avatar src="https://gitlab.com/favicon.ico" size="small" />,
    'Yahoo': <Avatar src="https://www.yahoo.com/favicon.ico" size="small" />,
    'Steam': <Avatar src="https://store.steampowered.com/favicon.ico" size="small" />,
    'Wordpress': <Avatar src="https://wordpress.org/favicon.ico" size="small" />,
    'Bitbucket': <Avatar src="https://bitbucket.org/favicon.ico" size="small" />,
    'Coinbase': <Avatar src="https://www.coinbase.com/favicon.ico" size="small" />,
    'Tencent': <Avatar src="https://www.tencent.com/favicon.ico" size="small" />,
    'Alibaba': <Avatar src="https://www.alibaba.com/favicon.ico" size="small" />,
    'Baidu': <Avatar src="https://www.baidu.com/favicon.ico" size="small" />,
    'Weibo': <Avatar src="https://weibo.com/favicon.ico" size="small" />,
    'Netease': <Avatar src="https://www.163.com/favicon.ico" size="small" />,
  };
  // 如果找到匹配的图标，返回图标
  // 否则返回基于issuer名称的Avatar
  if (iconMap[issuer]) {
    return iconMap[issuer];
  } else {
    return (
      <Avatar size="small" style={{ backgroundColor: stringToColor(issuer) }}>
        {issuer.charAt(0).toUpperCase()}
      </Avatar>
    );
  }
}

// 将字符串转换为颜色值
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

// 规范化 issuer 名称
const normalizeIssuer = (issuer: string): string => {
  if (!issuer) return '';
  const lowerIssuer = issuer.toLowerCase();
  const commonIssuers: Record<string, string> = {
    'google': 'Google',
    'microsoft': 'Microsoft',
    'github': 'Github', // 将不同的 GitHub写法统一
    'apple': 'Apple',
    'amazon': 'Amazon',
    'facebook': 'Facebook',
    'twitter': 'Twitter',
    // 添加更多常见服务提供商的名称规范化
    'dropbox': 'Dropbox',
    'linkedin': 'LinkedIn',
    'netflix': 'Netflix',
    'paypal': 'PayPal',
    'slack': 'Slack',
    'instagram': 'Instagram',
    'twitch': 'Twitch',
    'discord': 'Discord',
    'gitlab': 'Gitlab',
    'yahoo': 'Yahoo',
    'steam': 'Steam',
    'wordpress': 'Wordpress',
    'bitbucket': 'Bitbucket',
    'coinbase': 'Coinbase',
    '腾讯': 'Tencent',
    'tencent': 'Tencent',
    '阿里巴巴': 'Alibaba',
    'alibaba': 'Alibaba',
    '百度': 'Baidu',
    'baidu': 'Baidu',
    '微博': 'Weibo',
    'weibo': 'Weibo',
    '网易': 'Netease',
    'netease': 'Netease',
    '163': 'Netease',
  };
  if (commonIssuers[lowerIssuer]) {
    return commonIssuers[lowerIssuer];
  }
  // 对于不在映射中的，首字母大写
  return lowerIssuer.charAt(0).toUpperCase() + lowerIssuer.slice(1);
};

const labelAll = "all"

const OtpGroup: React.FC<OtpGroupProps> = ({ otpItems, onSelectIssuer }) => {
  const [activeGroup, setActiveGroup] = useState<string>(labelAll);
  const activeGroupRef = useRef(activeGroup);
  const radioGroupRef = useRef<HTMLDivElement>(null);
  
  // 防止 Radio.Group 组件获取焦点
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否有Radio组件获得了焦点
      const activeElement = document.activeElement;
      if (radioGroupRef.current && 
          (radioGroupRef.current.contains(activeElement) || 
          activeElement?.classList.contains('ant-radio-button-wrapper'))) {
        // 如果Radio组件获得了焦点且是方向键，将焦点转移到父元素
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          // 将焦点转移到父元素
          radioGroupRef.current.parentElement?.focus();
          // 不阻止冒泡，让父组件能够处理事件
        }
      }
    };
    
    // 全局事件监听，确保在Radio获取焦点时可以转移焦点
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const { list: issuerList, groups: groupedItems } = useMemo(() => {
    const groups: { [key: string]: OtpItem[] } = {
      [labelAll]: otpItems
    };
    const list = new Set<string>();
    otpItems.forEach((item) => {
      if (item.issuer) {
        const normalizedIssuer = normalizeIssuer(item.issuer); // 使用规范化函数
        list.add(normalizedIssuer);
        if (!groups[normalizedIssuer]) {
          groups[normalizedIssuer] = [];
        }
        groups[normalizedIssuer].push(item);
      }
    });
    console.log("render otp group")
    return { list: Array.from(list), groups };
  }, [otpItems])

  // 更新ref值
  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  useEffect(() => {
    // Make sure groupedItems and activeGroupRef.current are valid before calling
    if (groupedItems && activeGroupRef.current) {
      let newItems = groupedItems[activeGroupRef.current]
      if(!newItems){
        newItems = groupedItems[labelAll]
        setActiveGroup(labelAll)
      }
      onSelectIssuer(newItems);
    }
  }, [groupedItems, onSelectIssuer]);

  const groupOptions = useMemo(() => {
    const options = [
      {
        label: (
          <Space align="center" className="btn-space-content">
            <AppstoreOutlined />
            <span>全部</span>
          </Space>
        ), value: labelAll
      }
    ];
    issuerList.forEach((issuer) => {
      options.push({
        label: (
            <Space align="center" className="btn-space-content">
              {getIssuerIcon(issuer)}
              <span>{issuer}</span>
            </Space>
        ), value: issuer
      });
    });
    return options;
  }, [issuerList]);

  const handleGroupChange = (e: RadioChangeEvent) => {
    const newActiveGroup = e.target.value;
    setActiveGroup(newActiveGroup);
    if (groupedItems && newActiveGroup) {
      onSelectIssuer(groupedItems[newActiveGroup] || otpItems);
    }
  };

  return (
    <div className="otp-group-container" ref={radioGroupRef}>
      <Radio.Group
        options={groupOptions}
        value={activeGroup}
        onChange={handleGroupChange}
        optionType="button"
        buttonStyle="solid"
        className="otp-radio-group"
      />
      <style>
        {`
          .otp-group-container {
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 16px;
          }
          
          .otp-radio-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
          }
          
          /* 改进Radio按钮样式 */
          .ant-radio-button-wrapper {
            border-radius: 6px !important;
            padding: 4px 12px;
            min-width: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 0 !important;
            border: 1px solid #d9d9d9 !important;
            transition: all 0.3s;
            height: 32px;
            line-height: 1;
          }
          
          /* Space组件内容居中 */
          .btn-space-content {
            width: 100%;
            height: 100%;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          /* 修复图标垂直居中 */
          .ant-radio-button-wrapper .anticon {
            display: inline-flex !important;
            align-items: center !important;
            vertical-align: middle !important;
            margin-top: 0 !important;
          }
          
          /* 修复Avatar垂直居中 */
          .ant-radio-button-wrapper .ant-avatar {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            vertical-align: middle !important;
            line-height: 1 !important;
          }
          
          /* 确保文本垂直居中 */
          .ant-radio-button-wrapper span {
            line-height: 1 !important;
            vertical-align: middle !important;
          }
          
          .ant-radio-button-wrapper:not(:first-child)::before {
            display: none !important;
          }
          
          .ant-radio-button-wrapper-checked {
            background-color: #1890ff !important;
            color: white !important;
            border-color: #1890ff !important;
            box-shadow: 0 2px 6px rgba(24, 144, 255, 0.25) !important;
          }
          
          .ant-radio-button-wrapper:hover {
            color: #1890ff;
            border-color: #1890ff !important;
          }
          
          .ant-radio-button-wrapper-checked:hover {
            color: white !important;
          }
          
          /* 防止Radio获取键盘焦点 */
          .ant-radio-button-wrapper:focus,
          .ant-radio-button-wrapper-checked:focus,
          .ant-radio-button-wrapper:focus-within,
          .ant-radio-button-wrapper-checked:focus-within {
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* 确保Tab键无法选中Radio按钮 */
          .ant-radio-button-wrapper input[type="radio"] {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: -1;
            visibility: hidden;
          }
          
          /* 适配暗色主题 */
          @media (prefers-color-scheme: dark) {
            .otp-group-container {
              background-color: #1f1f1f;
            }
            
            .ant-radio-button-wrapper {
              background-color: #2a2a2a;
              border-color: #434343 !important;
              color: #d9d9d9;
            }
            
            .ant-radio-button-wrapper:hover:not(.ant-radio-button-wrapper-checked) {
              background-color: #2a2a2a;
              color: #1890ff;
              border-color: #1890ff !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default OtpGroup;
