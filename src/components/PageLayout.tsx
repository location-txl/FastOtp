import React, { ReactNode, useEffect, useRef, useState } from 'react';

interface PageLayoutProps {
  headerContent?: ReactNode;
  children?: ReactNode;
  footerContent?: ReactNode;
  headerHeight?: number;
  footerHeight?: number;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  headerContent,
  children,
  footerContent,
  headerHeight: propHeaderHeight,
  footerHeight: propFooterHeight,
}) => {
  // 创建ref用于测量实际元素高度
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  
  // 状态用于存储计算得到的高度
  const [headerHeight, setHeaderHeight] = useState(propHeaderHeight || 0);
  const [footerHeight, setFooterHeight] = useState(propFooterHeight || 0);

  // 添加useEffect，在组件挂载时禁用body滚动
  useEffect(() => {
    // 保存原始overflow设置
    const originalStyle = document.body.style.overflow;
    // 禁用body的滚动
    document.body.style.overflow = 'hidden';
    
    // 组件卸载时恢复原始设置
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // 添加useEffect，在组件挂载和更新后测量元素高度
  useEffect(() => {
    // 创建更新高度的函数
    const updateHeights = () => {
      // 直接测量当前高度
      if (headerRef.current && !propHeaderHeight) {
        const actualHeaderHeight = headerRef.current.getBoundingClientRect().height;
        setHeaderHeight(actualHeaderHeight);
      }
      
      if (footerRef.current && !propFooterHeight) {
        const actualFooterHeight = footerRef.current.getBoundingClientRect().height;
        setFooterHeight(actualFooterHeight);
      }
    };

    // 立即执行一次
    updateHeights();
    
    // 延迟再次执行以确保DOM完全渲染
    const timerId = setTimeout(updateHeights, 100);
    
    // 创建ResizeObserver监听元素大小变化
    const resizeObserver = new ResizeObserver(() => {
      updateHeights();
    });

    // 监听元素
    if (headerRef.current && !propHeaderHeight) {
      resizeObserver.observe(headerRef.current);
    }

    if (footerRef.current && !propFooterHeight) {
      resizeObserver.observe(footerRef.current);
    }

    // 监听窗口大小变化
    window.addEventListener('resize', updateHeights);

    // 清理函数
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeights);
      clearTimeout(timerId);
    };
  }, [propHeaderHeight, propFooterHeight, headerContent, footerContent]);

  // 确保有足够的安全边距
  const safetyMargin = 20; // 增加到20px的安全边距

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header部分 */}
      {headerContent && (
        <div
          ref={headerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            height: propHeaderHeight || 'auto',
            padding: '0 16px',
          }}
        >
          {headerContent}
        </div>
      )}
      
      {/* Content部分 */}
      <div
        style={{
          position: 'absolute',
          top: headerContent ? `${headerHeight}px` : 0,
          bottom: footerContent ? `${footerHeight + safetyMargin}px` : 0,
          left: 0,
          right: 0,
          overflow: 'auto',
        }}
      >
        {children}
      </div>
      
      {/* Footer部分 */}
      {footerContent && (
        <div
          ref={footerRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            height: propFooterHeight || 'auto',
            textAlign: 'center',
          }}
        >
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default PageLayout; 