import { useState } from 'react';
import { X, MapPin, Package, AlertTriangle, CheckCircle2, Wrench, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Tool } from '@/types';
import { formatDateTime } from '@/utils/date';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';

const statusConfig: Record<Tool['status'], { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  available: { label: '正常可用', variant: 'success' },
  maintenance: { label: '维修中', variant: 'warning' },
  lost: { label: '已丢失', variant: 'danger' },
};

export default function ToolDetailDrawer() {
  const { selectedTool, setSelectedTool, currentUser, isAdminView, updateToolStatus, updateToolLocation, buildings, tools } = useAppStore();
  const [showManageModal, setShowManageModal] = useState(false);
  const [newStatus, setNewStatus] = useState<Tool['status']>('available');
  const [newLocation, setNewLocation] = useState('');
  const [newBuildingId, setNewBuildingId] = useState('');

  if (!selectedTool) return null;

  const tool = tools.find((t) => t.id === selectedTool.id) || selectedTool;
  const isAvailable = tool.availableStock > 0 && tool.status === 'available';
  const isBlacklisted = currentUser.isBlacklisted;
  const statusInfo = statusConfig[tool.status];

  const openManageModal = () => {
    setNewStatus(tool.status);
    setNewLocation(tool.location);
    setNewBuildingId(tool.buildingId || '');
    setShowManageModal(true);
  };

  const handleSaveManage = () => {
    updateToolStatus(tool.id, newStatus);
    const building = buildings.find((b) => b.id === newBuildingId);
    updateToolLocation(tool.id, newLocation, newBuildingId, building?.name);
    setShowManageModal(false);
  };

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
              <h3 className="text-xl font-bold text-gray-900 mb-1">{tool.name}</h3>
              <p className="text-sm text-gray-500">{tool.categoryName} · {tool.buildingName}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isAvailable ? (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  可借 {tool.availableStock}/{tool.totalStock} 件
                </Badge>
              ) : (
                <Badge variant="danger">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {tool.status === 'available' ? '暂无库存' : '不可借'}
                </Badge>
              )}
              <Badge variant={statusInfo.variant} className="text-xs">
                <Wrench className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6">{tool.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">押金</p>
              <p className="text-xl font-bold text-gray-900">¥{tool.deposit}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">日租金</p>
              <p className="text-xl font-bold text-orange-600">¥{tool.dailyRent}/天</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                存放位置
              </h4>
              <p className="text-sm text-gray-600">{tool.location}</p>
            </div>

            {tool.specifications && tool.specifications.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  规格参数
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tool.specifications.map((spec, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tool.usageNotes && tool.usageNotes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  使用注意事项
                </h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {tool.usageNotes.map((note, index) => (
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
            工具编号: {tool.qrCode} · 累计借用 {tool.borrowCount} 次
          </div>

          <div className="space-y-3">
            {isAdminView && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={openManageModal}
              >
                <Settings className="w-4 h-4 mr-2" />
                库存调配 / 状态管理
              </Button>
            )}

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
              <Link to={`/reservation?toolId=${tool.id}`} className="block">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={!isAvailable}
                >
                  {isAvailable ? '立即预约借用' : tool.status !== 'available' ? statusInfo.label : '暂无可用库存'}
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

      <Modal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        title={`库存调配 - ${tool.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工具状态
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'available' as const, label: '正常', color: 'bg-emerald-100 text-emerald-700' },
                { key: 'maintenance' as const, label: '维修中', color: 'bg-amber-100 text-amber-700' },
                { key: 'lost' as const, label: '丢失', color: 'bg-red-100 text-red-700' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setNewStatus(item.key)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    newStatus === item.key
                      ? `${item.color} ring-2 ring-offset-1 ring-current`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              存放楼栋
            </label>
            <select
              value={newBuildingId}
              onChange={(e) => setNewBuildingId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">请选择楼栋</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              具体位置
            </label>
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="如：1楼工具柜A区"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-medium">提示：</span>
              状态改为「维修中」或「丢失」后，该工具将无法被预约。位置调整后将同步更新到工具目录。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowManageModal(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveManage}
              disabled={!newLocation.trim()}
            >
              保存调整
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
