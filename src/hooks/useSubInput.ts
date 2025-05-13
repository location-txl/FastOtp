import { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { PluginEnterContext } from './PageEnterContext';
/**
 * React hook用于管理uTools子输入框
 * @param onChange 输入框内容变化时的回调函数
 * @param placeholder 输入框占位符
 * @param autoFocus 是否自动聚焦，默认为true
 * @param initialValue 初始值
 * @returns 包含输入值、设置输入值和控制子输入框的方法
 */
export const useSubInput = (
  onChange?: (text: string) => void,
  placeholder?: string,
  autoFocus: boolean = true,
  initialValue: string = ''
) => {
  const [value, setValue] = useState(initialValue);
  const pageEnter = useContext(PluginEnterContext);
  
  // 使用ref存储最新的onChange回调，避免依赖变化
  const onChangeRef = useRef(onChange);
  
  // 更新ref
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // 稳定的处理函数，不会随渲染变化
  const handleInputChange = useCallback(({ text }: { text: string }) => {
    setValue(text);
    onChangeRef.current?.(text);
  }, []);

  // 设置子输入框，仅在组件挂载和placeholder/autoFocus变化时执行
  useEffect(() => {
    if(!pageEnter) return;
    if (!window.utools) return;

    console.log('设置子输入框', Date.now());
    // 设置子输入框
    window.utools.setSubInput(
      handleInputChange, 
      placeholder,
      autoFocus
    );
    handleInputChange({text: initialValue});

    // 如果有初始值，设置子输入框的值
    if (initialValue) {
      window.utools.setSubInputValue(initialValue);
    }

    // 组件卸载时移除子输入框
    return () => {
      window.utools.removeSubInput();
    };
  }, [placeholder, autoFocus, handleInputChange, initialValue, pageEnter]);

  // 设置子输入框的值
  const setInputValue = useCallback((text: string) => {
    if (window.utools) {
      window.utools.setSubInputValue(text);
      setValue(text);
    }
  }, []);

  // 聚焦子输入框
  const focus = useCallback(() => {
    if (window.utools) {
      window.utools.subInputFocus();
    }
  }, []);

  // 子输入框失去焦点
  const blur = useCallback(() => {
    if (window.utools) {
      window.utools.subInputBlur();
    }
  }, []);

  // 选中子输入框内容
  const select = useCallback(() => {
    if (window.utools) {
      window.utools.subInputSelect();
    }
  }, []);

  return {
    value,
    setValue: setInputValue,
    focus,
    blur,
    select
  };
}; 