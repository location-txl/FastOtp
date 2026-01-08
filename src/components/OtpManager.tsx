import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { Button, Empty, Modal, Typography, Input, App, Space, Tooltip, theme, List } from 'antd';
import { PlusOutlined, ExclamationCircleFilled, ImportOutlined, QuestionCircleOutlined, FileTextOutlined, ExportOutlined, HistoryOutlined, DeleteOutlined, UndoOutlined, DeleteFilled } from '@ant-design/icons';
import OtpCard from './OtpCard';
import OtpForm from './OtpForm';
import ChangelogModal from './ChangelogModal';
import { messageRef } from '../App';
import { DEFAULT_OTP_PERIOD } from '../constants';
import { OtpItem } from '../custom';
import { useSubInput } from '../hooks/useSubInput';
import PageLayout from './PageLayout';
import OtpGroup from './OtpGroup';
import { PluginEnterContext } from '../hooks/PageEnterContext';

const { Text } = Typography;
const { TextArea } = Input;
const { useToken } = theme;

const calculateTimeLeft = () => {
  const now = Math.floor(Date.now() / 1000);
  return DEFAULT_OTP_PERIOD - (now % DEFAULT_OTP_PERIOD);
};

const OtpManager: React.FC = () => {
  const [otpItems, setOtpItems] = useState<OtpItem[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editItem, setEditItem] = useState<OtpItem | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importUri, setImportUri] = useState('');
  const [changelogVisible, setChangelogVisible] = useState(false);
  const [deletedModalVisible, setDeletedModalVisible] = useState(false);
  const [deletedItems, setDeletedItems] = useState<OtpItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [groupItems, setGroupItems] = useState<OtpItem[]>([]);
  
  // 添加共用计时器状态
  const [timeLeft, setTimeLeft] = useState(DEFAULT_OTP_PERIOD);
  
  // 使用refreshCounter替代shouldRefreshOtp
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // 使用useRef代替useState存储验证码，避免重新渲染循环
  const currentOtpsRef = useRef<string[]>([]);
  
  // 获取App上下文中的modal API
  const { modal } = App.useApp();
  
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取主题色
  const { token } = useToken();

  const { value:searchText } = useSubInput(
    undefined,
    '搜索验证码',
    true,
    ''
  );

  const pageEnter = useContext(PluginEnterContext);
  
  // 使用useMemo缓存不同issuer分组的数据

  
  // 基于搜索文本和当前激活分组过滤数据
  const filteredItems = useMemo(() => {
    if (searchText && searchText.trim().length > 0) {
      const searchLow = searchText.toLowerCase();
      return otpItems.filter(item => 
        (item.issuer && item.issuer.toLowerCase().includes(searchLow)) || 
        (item.name && item.name.toLowerCase().includes(searchLow))
      );
    } else {
      // 直接使用缓存的分组数据
      return groupItems;
    }
  }, [otpItems, searchText, groupItems]);

  // 共用的计时器逻辑
  useEffect(() => {
    // 初始化：计算当前时间剩余
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);

    // 设置全局计时器
    const timerInterval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      
      // 如果剩余时间改变，更新状态
      if (newTimeLeft !== timeLeft) {
        setTimeLeft(newTimeLeft);
        
        // 如果是新周期开始，增加refreshCounter触发OTP刷新
        if (newTimeLeft === DEFAULT_OTP_PERIOD) {
          setRefreshCounter(prev => prev + 1);
        }
      }
    }, 500); // 使用500ms间隔，确保准确捕获秒数变化

    return () => {
      clearInterval(timerInterval);
    };
  }, [timeLeft]);

  // 插件重新进入时，强制刷新一次验证码，避免后台停留导致的旧值
  useEffect(() => {
    if (!pageEnter) return;

    const newTimeLeft = calculateTimeLeft();
    setTimeLeft(newTimeLeft);
    setRefreshCounter(prev => prev + 1);
  }, [pageEnter]);

  useEffect(() => {
    // 组件挂载后自动聚焦到容器，但只在没有模态框打开时
    if (containerRef.current && !formVisible && !importModalVisible && !changelogVisible && !deletedModalVisible) {
        containerRef.current.focus();
    }
  }, [formVisible, importModalVisible, changelogVisible, deletedModalVisible]);

  useEffect(() => {
    // 重置引用数组大小以匹配当前项目数量
    cardRefs.current = cardRefs.current.slice(0, filteredItems.length);
    // 如果有项目且未选择任何项目，默认选择第一个
    if (filteredItems.length > 0 && selectedIndex === -1) {
      setSelectedIndex(0);
    } else if (selectedIndex >= filteredItems.length) {
      // 如果选择的索引超出范围，重置为最后一个
      setSelectedIndex(filteredItems.length - 1);
    }
  }, [filteredItems, selectedIndex]);

  // 滚动选中项到可视区域
  const scrollItemIntoView = (index: number) => {
    if (index >= 0 && index < cardRefs.current.length && cardRefs.current[index]) {
      cardRefs.current[index].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  };

  const loadOtpItems = () => {
    try {
      const items = window.api.otp.getOtpItems();
      setOtpItems(items);
    } catch (error) {
      console.error('加载OTP项目失败:', error);
      if (messageRef.current) {
        messageRef.current.error('加载验证器列表失败');
      }
    }
  };

  const loadDeletedItems = () => {
    try {
      const items = window.api.otp.getDeletedItems();
      setDeletedItems(items);
    } catch (error) {
      console.error('加载已删除项目失败:', error);
      if (messageRef.current) {
        messageRef.current.error('加载已删除验证器列表失败');
      }
    }
  };

  const handleShowDeleted = () => {
    loadDeletedItems();
    setDeletedModalVisible(true);
  };

  const handleRestoreItem = (id: string) => {
    try {
      window.api.otp.restoreDeletedItem(id);
      if (messageRef.current) {
        messageRef.current.success('验证器已恢复');
      }
      loadDeletedItems();
      loadOtpItems();
    } catch (error) {
      console.error('恢复验证器失败:', error);
      if (messageRef.current) {
        messageRef.current.error('恢复验证器失败');
      }
    }
  };

  const handlePermanentDelete = (id: string) => {
    modal.confirm({
      title: '确认永久删除',
      icon: <ExclamationCircleFilled />,
      content: '此操作不可恢复，确定要永久删除此验证器吗？',
      okText: '永久删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        try {
          window.api.otp.permanentDeleteItem(id);
          if (messageRef.current) {
            messageRef.current.success('验证器已永久删除');
          }
          loadDeletedItems();
        } catch (error) {
          console.error('永久删除验证器失败:', error);
          if (messageRef.current) {
            messageRef.current.error('永久删除验证器失败');
          }
        }
      }
    });
  };
  useEffect(() => {
    loadOtpItems();
  }, []);

  // 使用React的onKeyDown事件处理键盘输入
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // 如果表单或导入模态框或更新日志或已删除项目模态框打开，不处理键盘事件
    if (formVisible || importModalVisible || changelogVisible || deletedModalVisible) return;
    
    // 检查事件目标是否为输入框，如果是，则不处理键盘事件
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    console.log('键盘事件:', event.key, '当前选中:', selectedIndex);

    switch (event.key) {
      case 'ArrowUp':
        console.log('向上箭头按下');
        event.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = Math.max(0, prev - 1);
          console.log('新索引:', newIndex);
          // 在下一个渲染周期滚动到视图
          setTimeout(() => scrollItemIntoView(newIndex), 0);
          return newIndex;
        });
        break;
      case 'ArrowDown':
        console.log('向下箭头按下');
        event.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = Math.min(filteredItems.length - 1, prev + 1);
          console.log('新索引:', newIndex);
          // 在下一个渲染周期滚动到视图
          setTimeout(() => scrollItemIntoView(newIndex), 0);
          return newIndex;
        });
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          // 使用ref中存储的验证码，而不是state
          const code = currentOtpsRef.current[selectedIndex];
          if (code) {
            try {
              window.api.otp.copyToClipboard(code);
              const item = filteredItems[selectedIndex];
              const title = item.issuer || '';
              const name = item.name || '验证码';
              window.utools.showNotification(`${title ? title + ' - ' : ''}${name} 验证码已复制并输入: ${code}`);

              // 隐藏uTools主窗口并直接输入验证码
              window.utools.hideMainWindowTypeString(code);
            } catch (e) {
              console.error('自动输入验证码失败:', e);
              if (messageRef.current) {
                messageRef.current.error('自动输入验证码失败');
              }
            }
          } else {
            if (messageRef.current) {
              messageRef.current.error('验证码不可用');
            }
          }
        }
        break;
      default:
        break;
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormVisible(true);
  };

  const handleEdit = (item: OtpItem) => {
    setEditItem(item);
    setFormVisible(true);
  };

  const handleSave = (item: OtpItem) => {
    try {
      if (item.id) {
        // 更新现有项目
        window.api.otp.updateOtpItem(item);
        if (messageRef.current) {
          messageRef.current.success('验证器已更新');
        }
      } else {
        // 添加新项目
        window.api.otp.saveOtpItem(item);
        if (messageRef.current) {
          messageRef.current.success('验证器已添加');
        }
      }
      setFormVisible(false);
      loadOtpItems();
      // 保存后恢复容器焦点
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('保存OTP项目失败:', error);
      if (messageRef.current) {
        messageRef.current.error('保存验证器失败');
      }
    }
  };

  const handleDelete = (id: string) => {
    // 使用组件级别获取的modal API
    modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleFilled />,
      content: '删除后将移到已删除列表，可以在"已删除验证器"中恢复或永久删除，确定要删除此验证器吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        try {
          window.api.otp.deleteOtpItem(id);
          if (messageRef.current) {
            messageRef.current.success('验证器已移到已删除列表');
          }
          loadOtpItems();
        } catch (error) {
          console.error('删除OTP项目失败:', error);
          if (messageRef.current) {
            messageRef.current.error('删除验证器失败');
          }
        }
      }
    });
  };

  const handleImport = () => {
    setImportModalVisible(true);
  };

  const handleImportSubmit = () => {
    if (!importUri.trim()) {
      if (messageRef.current) {
        messageRef.current.warning('请输入有效的OTP URI');
      }
      return;
    }

    try {
      window.api.otp.importOtpUri(importUri.trim());
      if (messageRef.current) {
        messageRef.current.success('验证器导入成功');
      }
      setImportModalVisible(false);
      setImportUri('');
      loadOtpItems();
      // 导入模态框关闭后，恢复容器焦点
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      }, 100);
    } catch (error: unknown) {
      console.error('导入OTP失败:', error);
      if (messageRef.current) {
        messageRef.current.error('导入失败: ' + ((error as Error).message || '未知错误'));
      }
    }
  };

  // 简化文件导入处理，直接使用uTools API选择文件
  const handleFileImport = () => {
    try {
      // 使用window.utools API
      const files = window.utools?.showOpenDialog({
        title: '选择OTP文本文件',
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
        properties: ['openFile']
      });
      
      if (!files || files.length === 0) {
        return; // 用户取消了选择
      }
      
      const filePath = files[0];
      
      // 导入文件
      const result = window.api.otp.importOtpFromFile(filePath);
      
      if (result.success > 0) {
        if (messageRef.current) {
          messageRef.current.success(`成功导入 ${result.success} 个验证器`);
        }
        loadOtpItems();
      } else {
        if (messageRef.current) {
          messageRef.current.error('导入失败: 未找到有效的OTP URI');
        }
      }
    } catch (error: unknown) {
      console.error('导入OTP文件失败:', error);
      if (messageRef.current) {
        messageRef.current.error('导入失败: ' + ((error as Error).message || '未知错误'));
      }
    }
  };

  // 导出OTP配置
  const handleExport = async () => {
    try {
      const result = window.api.otp.exportOtpToFile();
      
      if (result.success) {
        if (messageRef.current) {
          messageRef.current.success(result.message);
        }
        
        // 显示系统通知
        if (window.utools) {
          window.utools.showNotification(`已导出 ${result.count} 个验证器到文件`);
        }
      } else {
        if (messageRef.current) {
          messageRef.current.error(result.message);
        }
      }
    } catch (error: unknown) {
      console.error('导出OTP失败:', error);
      if (messageRef.current) {
        messageRef.current.error('导出失败: ' + ((error as Error).message || '未知错误'));
      }
    }
  };

  const setCardRef = (el: HTMLDivElement | null, index: number) => {
    if (el) {
      cardRefs.current[index] = el;
    }
  };

  // 处理验证码生成的回调 - 使用ref而非state
  const handleOtpGenerated = (otp: string, index: number) => {
    if (!currentOtpsRef.current) {
      currentOtpsRef.current = [];
    }
    currentOtpsRef.current[index] = otp;
  };

  // 渲染当前分组的OTP卡片
  const renderCurrentGroupOtpCards = () => {
    const items = filteredItems;
    
    if (items.length === 0) {
      return (
        <Empty 
          description={searchText.length > 0 ? '未找到匹配的验证器' : '此分组暂无验证器'} 
          style={{ marginTop: 60 }}
        />
      );
    }

    return (
      <div className="otp-cards-container" >
        {items.map((item, index) => (
          <div 
            key={item.id}
            ref={(el) => setCardRef(el, index)}
            onClick={() => setSelectedIndex(index)}
          >
            <OtpCard 
              item={item}
              index={index}
              onDelete={handleDelete}
              onEdit={handleEdit}
              isSelected={selectedIndex === index}
              onOtpGenerated={(otp) => handleOtpGenerated(otp, index)}
              timeLeft={timeLeft}
              refreshKey={refreshCounter}
            />
          </div>
        ))}
      </div>
    );
  };

  // 处理分组切换
  const handleGroupChange = useCallback((newGroupItems:OtpItem[]) => {
    setGroupItems(newGroupItems);
    setSelectedIndex(-1); // 重置选中项
  }, []);



  return (
    <div 
      ref={containerRef}
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      style={{ 
        outline: 'none', 
        width: '100%', 
        height: '100%'
      }}
    >
      <PageLayout
        headerContent={
          <div style={{ display: searchText.length > 0 ? 'none' : 'block' }}>
            <OtpGroup otpItems={otpItems} onSelectIssuer={handleGroupChange} />
          </div>
        }
        footerHeight={40}
        footerContent={
          <div 
            className="otp-footer"
            style={{ 
              backgroundColor: token.colorBgElevated,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              height:'40px',
              width: '100%',
              padding: '0 16px'
            }}
          >
            <Space>
              <Tooltip title="添加验证器">
                <Button 
                  type="text" 
                  icon={<PlusOutlined />} 
                  onClick={handleAdd}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="导入验证器">
                <Button 
                  type="text" 
                  icon={<ImportOutlined />} 
                  onClick={handleImport}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="从文本文件导入">
                <Button 
                  type="text" 
                  icon={<FileTextOutlined />} 
                  onClick={handleFileImport}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="导出验证器配置">
                <Button 
                  type="text" 
                  icon={<ExportOutlined />} 
                  onClick={handleExport}
                  size="small"
                  disabled={otpItems.length === 0}
                />
              </Tooltip>
              <Tooltip title="查看更新日志">
                <Button 
                  type="text" 
                  icon={<HistoryOutlined />} 
                  onClick={() => setChangelogVisible(true)}
                  size="small"
                />
              </Tooltip>
            </Space>
            
            <Space size={8}>
              <Tooltip title="查看已删除的验证器">
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  onClick={handleShowDeleted}
                  size="small"
                />
              </Tooltip>
              
              {otpItems.length > 0 && (
                <Tooltip title="使用↑↓键选择验证码，回车键复制选中验证码，或按下 Ctrl/⌘ + 数字键(1-9)快速复制对应的验证码">
                  <Space size={4}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>快捷键</Text>
                    <QuestionCircleOutlined style={{ color: token.colorPrimary, fontSize: '14px' }} />
                  </Space>
                </Tooltip>
              )}
            </Space>
          </div>
        }
      >
        <div className="otp-content">
          {renderCurrentGroupOtpCards()}
        </div>
      </PageLayout>

      <OtpForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          // 表单关闭后，恢复容器焦点
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.focus();
            }
          }, 100);
        }}
        onSave={handleSave}
        editItem={editItem}
      />

      <Modal
        title="导入OTP验证器"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportUri('');
          // 模态框关闭后，恢复容器焦点
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.focus();
            }
          }, 100);
        }}
        onOk={handleImportSubmit}
        okText="导入"
        cancelText="取消"
      >
        <div>
          <p>请输入OTP URI格式的验证器数据：</p>
          <TextArea
            rows={4}
            value={importUri}
            onChange={(e) => setImportUri(e.target.value)}
            placeholder="otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example"
          />
          <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
            格式: otpauth://totp/[发行方]:[账户]?secret=[密钥]&issuer=[发行方]&...
          </Text>
        </div>
      </Modal>

      <ChangelogModal 
        open={changelogVisible}
        onClose={() => setChangelogVisible(false)}
      />

      <Modal
        title="已删除的验证器"
        open={deletedModalVisible}
        onCancel={() => {
          setDeletedModalVisible(false);
          // 模态框关闭后，恢复容器焦点
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.focus();
            }
          }, 100);
        }}
        footer={null}
        width={600}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {deletedItems.length === 0 ? (
            <Empty 
              description="暂无已删除的验证器" 
              style={{ marginTop: 20, marginBottom: 20 }}
            />
          ) : (
            <List
              dataSource={deletedItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tooltip title="恢复验证器">
                      <Button
                        type="text"
                        icon={<UndoOutlined />}
                        onClick={() => handleRestoreItem(item.id)}
                        size="small"
                      />
                    </Tooltip>,
                    <Tooltip title="永久删除">
                      <Button
                        type="text"
                        icon={<DeleteFilled />}
                        onClick={() => handlePermanentDelete(item.id)}
                        size="small"
                        danger
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div>
                        <Text strong>{item.issuer || '未知发行方'}</Text>
                        {item.name && <Text type="secondary" style={{ marginLeft: 8 }}>- {item.name}</Text>}
                      </div>
                    }
                    description={
                      <div>
                        {item.remark && (
                          <div style={{ marginBottom: 4 }}>
                            <Text type="secondary">{item.remark}</Text>
                          </div>
                        )}
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          删除时间: {item.deletedAt ? new Date(item.deletedAt).toLocaleString('zh-CN') : '未知'}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default OtpManager; 
