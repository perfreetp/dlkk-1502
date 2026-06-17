import { Package, MapPin, Clock, Zap, Wrench, SprayCan, Truck, Ruler } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tool } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useAppStore } from '@/store';

const categoryIcons: Record<string, typeof Zap> = {
  c1: Zap,
  c2: Wrench,
  c3: SprayCan,
  c4: Truck,
  c5: Ruler,
};

interface ToolCardProps {
  tool: Tool;
  onSelect?: (tool: Tool) => void;
}

export default function ToolCard({ tool, onSelect }: ToolCardProps) {
  const { setSelectedTool } = useAppStore();
  const CategoryIcon = categoryIcons[tool.categoryId] || Package;

  const handleClick = () => {
    setSelectedTool(tool);
    onSelect?.(tool);
  };

  const isAvailable = tool.availableStock > 0 && tool.status === 'available';
  const statusLabel = tool.status === 'maintenance' ? '维修中' : tool.status === 'lost' ? '已丢失' : null;
  const statusVariant = tool.status === 'maintenance' ? 'warning' : tool.status === 'lost' ? 'danger' : 'success';

  return (
    <Card hover onClick={handleClick}>
      <div className="relative">
        <img
          src={tool.image}
          alt={tool.name}
          className={`w-full h-40 object-cover rounded-t-lg ${!isAvailable ? 'opacity-60 grayscale' : ''}`}
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <Badge variant="primary">
            <CategoryIcon className="w-3 h-3 mr-1" />
            {tool.categoryName}
          </Badge>
          {statusLabel && (
            <Badge variant={statusVariant as any}>{statusLabel}</Badge>
          )}
        </div>
        {isAvailable ? (
          <div className="absolute top-3 right-3">
            <Badge variant="success">可借 {tool.availableStock} 件</Badge>
          </div>
        ) : (
          <div className="absolute top-3 right-3">
            <Badge variant="danger">{statusLabel || '暂无库存'}</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1">{tool.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">{tool.description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {tool.buildingName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            已借 {tool.borrowCount} 次
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">押金</span>
            <p className="text-sm font-semibold text-gray-900">¥{tool.deposit}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">日租金</span>
            <p className="text-sm font-semibold text-orange-600">¥{tool.dailyRent}/天</p>
          </div>
        </div>
        <Link
          to={`/reservation?toolId=${tool.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`mt-3 w-full flex items-center justify-center py-2 rounded text-sm font-medium transition-colors ${
            isAvailable
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAvailable ? '立即预约' : statusLabel || '暂无可用'}
        </Link>
      </div>
    </Card>
  );
}
