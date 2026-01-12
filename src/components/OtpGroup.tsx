import { Avatar, Radio, Space, RadioChangeEvent } from "antd";
import { OtpItem } from "../custom";
import { AppstoreOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState, useRef } from "react";

interface OtpGroupProps {
  otpItems: OtpItem[];
  onSelectIssuer: (otpItems: OtpItem[]) => void;
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

const normalizeIssuerKey = (issuerRaw: string): string => {
  return issuerRaw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
};

// issuer 别名 -> 规范展示名（尽量聚合到同一分组）
const issuerAliasMap: Record<string, string> = {
  // OpenAI
  openai: "OpenAI",
  chatgpt: "OpenAI",
  openaicom: "OpenAI",
  apiopenaicom: "OpenAI",

  // 飞书 / Lark
  飞书: "Feishu",
  feishu: "Feishu",
  feishucn: "Feishu",
  lark: "Feishu",
  larksuite: "Feishu",
  larksuitecom: "Feishu",

  // V2EX
  v2ex: "V2EX",
  v2excom: "V2EX",
  v2exorg: "V2EX",

  // Cloudflare
  cloudflare: "Cloudflare",
  cloudflarecom: "Cloudflare",

  // 常见服务
  google: "Google",
  microsoft: "Microsoft",
  office365: "Microsoft",
  github: "GitHub",
  githubcom: "GitHub",
  gitlab: "GitLab",
  gitlabcom: "GitLab",
  gitee: "Gitee",
  giteecom: "Gitee",
  apple: "Apple",
  amazon: "Amazon",
  aws: "AWS",
  amazonwebservices: "AWS",
  facebook: "Facebook",
  twitter: "X",
  xcom: "X",
  dropbox: "Dropbox",
  linkedin: "LinkedIn",
  netflix: "Netflix",
  paypal: "PayPal",
  slack: "Slack",
  instagram: "Instagram",
  twitch: "Twitch",
  discord: "Discord",
  yahoo: "Yahoo",
  steam: "Steam",
  wordpress: "WordPress",
  bitbucket: "Bitbucket",
  coinbase: "Coinbase",
  vercel: "Vercel",
  vercelcom: "Vercel",
  netlify: "Netlify",
  netlifycom: "Netlify",
  digitalocean: "DigitalOcean",
  digitaloceancom: "DigitalOcean",
  cloudflarezero: "Cloudflare",
  notion: "Notion",
  notionso: "Notion",
  figma: "Figma",
  figmacom: "Figma",
  atlassian: "Atlassian",
  atlassiancom: "Atlassian",
  jira: "Atlassian",
  confluence: "Atlassian",
  zoom: "Zoom",
  zoomus: "Zoom",
  okta: "Okta",
  oktacom: "Okta",
  auth0: "Auth0",
  auth0com: "Auth0",
  onepassword: "1Password",
  "1password": "1Password",
  "1passwordcom": "1Password",
  bitwarden: "Bitwarden",
  bitwardencom: "Bitwarden",
  stripe: "Stripe",
  stripecom: "Stripe",
  sentry: "Sentry",
  sentryio: "Sentry",
  linear: "Linear",
  linearapp: "Linear",
  telegram: "Telegram",
  telegramorg: "Telegram",
  tencent: "Tencent",
  腾讯: "Tencent",
  wechat: "WeChat",
  weixin: "WeChat",
  微信: "WeChat",
  alipay: "Alipay",
  支付宝: "Alipay",
  dingtalk: "DingTalk",
  钉钉: "DingTalk",
  alibaba: "Alibaba",
  阿里巴巴: "Alibaba",
  baidu: "Baidu",
  百度: "Baidu",
  weibo: "Weibo",
  微博: "Weibo",
  netease: "Netease",
  网易: "Netease",
  "163": "Netease",
};

// 规范展示名 -> 域名候选（用于在线 favicon）
const issuerDomainCandidatesMap: Record<string, string[]> = {
  OpenAI: ["openai.com"],
  Feishu: ["feishu.cn", "larksuite.com"],
  V2EX: ["v2ex.com"],
  Cloudflare: ["cloudflare.com"],
  Google: ["google.com"],
  Microsoft: ["microsoft.com", "live.com"],
  GitHub: ["github.com"],
  GitLab: ["gitlab.com"],
  Gitee: ["gitee.com"],
  Apple: ["apple.com"],
  Amazon: ["amazon.com"],
  AWS: ["aws.amazon.com", "amazon.com"],
  Facebook: ["facebook.com"],
  X: ["x.com", "twitter.com"],
  Dropbox: ["dropbox.com"],
  LinkedIn: ["linkedin.com"],
  Netflix: ["netflix.com"],
  PayPal: ["paypal.com"],
  Slack: ["slack.com"],
  Instagram: ["instagram.com"],
  Twitch: ["twitch.tv"],
  Discord: ["discord.com"],
  Yahoo: ["yahoo.com"],
  Steam: ["store.steampowered.com", "steampowered.com"],
  WordPress: ["wordpress.org", "wordpress.com"],
  Bitbucket: ["bitbucket.org"],
  Coinbase: ["coinbase.com"],
  Vercel: ["vercel.com"],
  Netlify: ["netlify.com"],
  DigitalOcean: ["digitalocean.com"],
  Notion: ["notion.so"],
  Figma: ["figma.com"],
  Atlassian: ["atlassian.com"],
  Zoom: ["zoom.us"],
  Okta: ["okta.com"],
  Auth0: ["auth0.com"],
  "1Password": ["1password.com"],
  Bitwarden: ["bitwarden.com"],
  Stripe: ["stripe.com"],
  Sentry: ["sentry.io"],
  Linear: ["linear.app"],
  Telegram: ["telegram.org"],
  Tencent: ["tencent.com"],
  WeChat: ["weixin.qq.com", "wechat.com"],
  Alipay: ["alipay.com"],
  DingTalk: ["dingtalk.com"],
  Alibaba: ["alibaba.com"],
  Baidu: ["baidu.com"],
  Weibo: ["weibo.com"],
  Netease: ["163.com"],
};

const faviconUrlFromDomain = (domain: string) => {
  // Google 的 s2 favicon 覆盖面较广，且支持 size 参数
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
};

const extractDomainFromIssuer = (issuerRaw: string): string | undefined => {
  const text = issuerRaw.trim();
  if (!text) return undefined;

  // URL
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      return url.hostname || undefined;
    } catch {
      return undefined;
    }
  }

  // email
  const atIndex = text.lastIndexOf("@");
  if (atIndex > 0 && atIndex < text.length - 1) {
    const domain = text.slice(atIndex + 1).trim();
    if (domain.includes(".") && !domain.includes(" ")) return domain.toLowerCase();
  }

  // 直接像域名（可能包含 path）
  if (text.includes(".") && !text.includes(" ")) {
    const noProto = text.replace(/^www\./i, "");
    const hostname = noProto.split("/")[0].split("?")[0].split("#")[0];
    if (hostname.includes(".")) return hostname.toLowerCase();
  }

  return undefined;
};

// 规范化 issuer 名称（用于分组展示）
const normalizeIssuer = (issuer: string): string => {
  if (!issuer) return '';
  const key = normalizeIssuerKey(issuer);
  if (issuerAliasMap[key]) return issuerAliasMap[key];

  // 对于像域名的 issuer，尽量保留原信息（避免“example.com”被吞掉）
  const domain = extractDomainFromIssuer(issuer);
  if (domain) return domain;

  // 对于不在映射中的，首字母大写
  const lowerIssuer = issuer.trim().toLowerCase();
  return lowerIssuer.charAt(0).toUpperCase() + lowerIssuer.slice(1);
};

const IssuerAvatar: React.FC<{ issuer: string }> = ({ issuer }) => {
  const [domainIndex, setDomainIndex] = useState(0);
  const [useColorBg, setUseColorBg] = useState(false);
  const issuerKey = useMemo(() => normalizeIssuerKey(issuer), [issuer]);
  const normalizedIssuer = useMemo(() => issuerAliasMap[issuerKey] || issuer, [issuer, issuerKey]);

  const domainCandidates = useMemo(() => {
    const fromRaw = extractDomainFromIssuer(issuer);
    if (fromRaw) return [fromRaw];
    const fromMap = issuerDomainCandidatesMap[normalizedIssuer];
    if (fromMap && fromMap.length > 0) return fromMap;
    return [];
  }, [issuer, normalizedIssuer]);

  // issuer 切换时，重置头像加载状态，避免沿用上一个 issuer 的失败索引/占位状态
  useEffect(() => {
    setDomainIndex(0);
    // 没有在线头像来源时，直接使用彩色背景回退
    setUseColorBg(domainCandidates.length === 0);
  }, [issuer, domainCandidates.length]);

  const domain = domainCandidates[domainIndex];
  const faviconUrl = domain ? faviconUrlFromDomain(domain) : undefined;
  const displayText = normalizedIssuer || issuer;
  const fallbackText = (displayText.trim().charAt(0) || "?").toUpperCase();

  return (
    <Avatar
      size="small"
      src={faviconUrl}
      style={useColorBg ? { backgroundColor: stringToColor(displayText) } : undefined}
      onError={() => {
        // 有候选域名就换下一个；没有就让 Avatar 自动用 children 回退
        if (domainCandidates.length > 0 && domainIndex < domainCandidates.length - 1) {
          setDomainIndex(domainIndex + 1);
          return false;
        }
        setUseColorBg(true);
        return true;
      }}
    >
      {fallbackText}
    </Avatar>
  );
};

const getIssuerIcon = (issuer: string) => {
  return <IssuerAvatar issuer={issuer} />;
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
