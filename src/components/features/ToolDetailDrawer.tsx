import { X, MapPin, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store';
import { formatDateTime } from '@/utils/date';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';

export default function ToolDetailDrawer() {
  const { selectedTool, setSelectedTool, currentUser } = useAppStore();

  if (!selectedTool) return null;

  const isAvailable = selectedTool.availableStock > 0;
  const isBlacklisted = currentUser.isBlacklisted;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setSelectedTool(null)}
      />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">工具详情</h2>
          <button
            onClick={() => setSelectedTool(null)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <img
            src={selectedTool.image}
            alt={selectedTool.name}
            className="w-full h-56 object-cover rounded-lg mb-6"
          />

          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTool.name}</h3>
              <p className="text-sm text-gray-500">{selectedTool.categoryName} · {selectedTool.buildingName}</p>
            </div>
            {isAvailable ? (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                可借 {selectedTool.availableStock}/{selectedTool.totalStock} 件
              </Badge>
            ) : (
              <Badge variant="danger">
                <AlertTriangle className="w-3 h-3 mr-1" />
                暂无库存
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-6">{selectedTool.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">押金</p>
              <p className="text-xl font-bold text-gray-900">¥{selectedTool.deposit}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">日租金</p>
              <p className="text-xl font-bold text-orange-600">¥{selectedTool.dailyRent}/天</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                存放位置
              </h4>
              <p className="text-sm text-gray-600">{selectedTool.location}</p>
            </div>

            {selectedTool.specifications && selectedTool.specifications.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  规格参数
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedTool.specifications.map((spec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTool.usageNotes && selectedTool.usageNotes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  使用注意事项
                </h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {selectedTool.usageNotes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 mb-6">
            工具编号: {selectedTool.qrCode} · 累计借用 {selectedTool.borrowCount} 次
          </div>

          <div className="space-y-3">
            {isBlacklisted ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium mb-1">您当前处于黑名单中</p>
                <p className="text-xs text-red-600">原因: {currentUser.blacklistReason}</p>
                {currentUser.blacklistExpiry && (
                  <p className="text-xs text-red-600 mt-1">
                    解除时间: {formatDateTime(currentUser.blacklistExpiry)}
                  </p>
                )}
              </div>
            ) : (
              <Link to={`/reserve?toolId=${selectedTool.id}`} className="block">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={!isAvailable}
                >
                  {isAvailable ? '立即预约借用' : '暂无可用库存'}
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setSelectedTool(null)}
            >
              关闭
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
