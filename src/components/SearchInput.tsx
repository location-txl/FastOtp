import React, { useEffect, useCallback } from 'react';
import { useSubInput } from '../hooks/useSubInput';

interface SearchInputProps {
  onSearch?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  placeholder = '搜索',
  autoFocus = true,
  initialValue = '',
}) => {
  // 使用useCallback稳定化回调函数
  const handleSearch = useCallback((text: string) => {
    onSearch?.(text);
  }, [onSearch]);

  const { value, setValue, focus } = useSubInput(
    handleSearch,
    placeholder,
    autoFocus,
    initialValue
  );

  // 示例：通过快捷键清空输入框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setValue('');
        focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setValue, focus]);

  return (
    <div className="search-input-container">
      {/* 这里不需要实际的输入框，因为使用了uTools的子输入框 */}
      <div className="search-display">
        当前搜索: {value || '(空)'}
      </div>
      <div className="search-tips">
        <p>按ESC清空搜索</p>
      </div>
    </div>
  );
};

export default SearchInput; 