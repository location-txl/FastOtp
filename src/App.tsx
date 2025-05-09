import { ConfigProvider, theme, App as AntdApp } from 'antd';
import React, { useEffect, useState } from 'react';
import OtpManager from './components/OtpManager';
import CustomMessage, { CustomMessageRef } from './components/CustomMessage';
import zhCN from 'antd/locale/zh_CN';
import { PluginEnterContext, PluginEnterAction } from './hooks/PageEnterContext';
import './App.css';
// import './App.css';

// 创建全局消息对象
export const messageRef = React.createRef<CustomMessageRef>();

// 确保消息容器在DOM中渲染
// 在uTools插件环境中可能需要特别处理

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 优先使用uTools API检测深色模式（如果可用）
    if (window.utools && typeof window.utools.isDarkColors === 'function') {
      return window.utools.isDarkColors();
    }
    // 否则使用媒体查询
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [pageEnter, setPageEnter] = useState<PluginEnterAction | undefined>(undefined);

  useEffect(() => {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      // 当使用媒体查询检测主题变化时
      if (!(window.utools && typeof window.utools.isDarkColors === 'function')) {
        setIsDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    console.log('插件进入', Date.now());
    // 监听插件进入事件
    if (window.utools) {
      window.utools.onPluginEnter((action: PluginEnterAction) => {
        setPageEnter(action);
      });
      window.utools.onPluginOut(() => {
        setPageEnter(undefined);
      })
    }
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <AntdApp style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CustomMessage ref={messageRef} />
        
        <PluginEnterContext.Provider value={pageEnter}>
          <OtpManager />
        </PluginEnterContext.Provider>
      
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
