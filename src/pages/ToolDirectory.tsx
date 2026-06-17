import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Zap, Wrench, SprayCan, Truck, Ruler, Package, X } from 'lucide-react';
import { useAppStore } from '@/store';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import ToolCard from '@/components/features/ToolCard';
import ToolDetailDrawer from '@/components/features/ToolDetailDrawer';
import Input from '@/components/common/Input';

const categoryIcons: Record<string, typeof Zap> = {
  c1: Zap,
  c2: Wrench,
  c3: SprayCan,
  c4: Truck,
  c5: Ruler,
};

export default function ToolDirectory() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { tools, categories, buildings, setSelectedTool, currentUser } = useAppStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  useEffect(() => {
    if (highlightId) {
      const tool = tools.find((t) => t.id === highlightId);
      if (tool) {
        setSelectedTool(tool);
      }
    }
  }, [highlightId, tools, setSelectedTool]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (searchKeyword && !tool.name.toLowerCase().includes(searchKeyword.toLowerCase()) && !tool.description.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }
      if (selectedCategory && tool.categoryId !== selectedCategory) {
        return false;
      }
      if (selectedBuilding && tool.buildingId !== selectedBuilding) {
        return false;
      }
      if (statusFilter === 'available' && tool.availableStock <= 0) {
        return false;
      }
      if (statusFilter === 'unavailable' && tool.availableStock > 0) {
        return false;
      }
      return true;
    });
  }, [tools, searchKeyword, selectedCategory, selectedBuilding, statusFilter]);

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedCategory(null);
    setSelectedBuilding(null);
    setStatusFilter('all');
  };

  const hasActiveFilters = searchKeyword || selectedCategory || selectedBuilding || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">工具目录</h1>
          <p className="text-sm text-gray-500">共 {filteredTools.length} 件工具可供选择</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden"
        >
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </Button>
      </div>

      {currentUser.isBlacklisted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            您当前处于黑名单中，暂时无法预约工具。如有疑问，请联系物业前台。
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
          <Card className="sticky top-20">
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">筛选条件</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    清除全部
                  </button>
                )}
              </div>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索工具名称..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">工具分类</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === null
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    全部分类
                  </button>
                  {categories.map((category) => {
                    const Icon = categoryIcons[category.id] || Package;
                    const count = tools.filter((t) => t.categoryId === category.id).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {category.name}
                        </div>
                        <span className="text-xs text-gray-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">存放楼栋</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedBuilding(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedBuilding === null
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    全部楼栋
                  </button>
                  {buildings.map((building) => {
                    const count = tools.filter((t) => t.buildingId === building.id).length;
                    return (
                      <button
                        key={building.id}
                        onClick={() => setSelectedBuilding(building.id === selectedBuilding ? null : building.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedBuilding === building.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {building.name}
                        </div>
                        <span className="text-xs text-gray-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">库存状态</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: '全部', variant: 'default' as const },
                    { key: 'available', label: '可借', variant: 'success' as const },
                    { key: 'unavailable', label: '无货', variant: 'danger' as const },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setStatusFilter(item.key as typeof statusFilter)}
                    >
                      <Badge
                        variant={statusFilter === item.key ? item.variant : 'default'}
                        className={statusFilter !== item.key ? 'opacity-60' : ''}
                      >
                        {item.label}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </Card.Content>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-500">已选条件:</span>
              {selectedCategory && (
                <Badge variant="primary" className="flex items-center gap-1">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedBuilding && (
                <Badge variant="primary" className="flex items-center gap-1">
                  {buildings.find((b) => b.id === selectedBuilding)?.name}
                  <button onClick={() => setSelectedBuilding(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="primary" className="flex items-center gap-1">
                  {statusFilter === 'available' ? '可借' : '无货'}
                  <button onClick={() => setStatusFilter('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className={highlightId === tool.id ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}
                >
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-2">未找到符合条件的工具</h3>
              <p className="text-sm text-gray-500 mb-4">试试调整筛选条件或搜索关键词</p>
              <Button onClick={clearFilters} variant="outline">
                清除所有筛选
              </Button>
            </div>
          )}
        </main>
      </div>

      <ToolDetailDrawer />
    </div>
  );
}
