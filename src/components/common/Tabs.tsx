import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export default function Tabs({ items, defaultKey, activeKey: controlledKey, onChange, className = '' }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultKey || items[0]?.key);

  useEffect(() => {
    if (controlledKey && controlledKey !== activeKey) {
      setActiveKey(controlledKey);
    }
  }, [controlledKey, activeKey]);

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  const displayKey = controlledKey || activeKey;
  const activeItem = items.find((item) => item.key === displayKey);

  return (
    <div className={className}>
      <div className="flex border-b border-gray-200 mb-4">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => handleTabClick(item.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              displayKey === item.key
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{activeItem?.content}</div>
    </div>
  );
}
