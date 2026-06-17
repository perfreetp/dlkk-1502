import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2, ChevronDown, Info } from 'lucide-react';
import { useAppStore } from '@/store';
import { TimeSlot } from '@/types';
import { getDaysDiff, getTimeSlotLabel, formatDateTime } from '@/utils/date';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Calendar from '@/components/features/Calendar';
import Modal from '@/components/common/Modal';

const timeSlots: { key: TimeSlot; label: string; desc: string }[] = [
  { key: 'morning', label: '上午', desc: '9:00-12:00' },
  { key: 'afternoon', label: '下午', desc: '14:00-17:00' },
  { key: 'evening', label: '晚上', desc: '18:00-21:00' },
  { key: 'fullday', label: '全天', desc: '9:00-21:00' },
];

export default function Reservation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toolId = searchParams.get('toolId');

  const { tools, addReservation, currentUser, getMyReservations } = useAppStore();

  const [selectedToolId, setSelectedToolId] = useState<string | null>(toolId);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('fullday');
  const [purpose, setPurpose] = useState('');
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedTool = useMemo(
    () => tools.find((t) => t.id === selectedToolId) || null,
    [tools, selectedToolId]
  );

  const availableTools = useMemo(
    () => tools.filter((t) => t.availableStock > 0 && t.status === 'available'),
    [tools]
  );

  const myPendingReservations = useMemo(
    () => getMyReservations().filter((r) => r.status === 'pending' || r.status === 'approved'),
    [getMyReservations]
  );

  useEffect(() => {
    if (toolId) {
      setSelectedToolId(toolId);
    }
  }, [toolId]);

  const handleDateSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const daysDiff = startDate && endDate ? getDaysDiff(startDate, endDate) + 1 : 0;
  const totalDeposit = selectedTool?.deposit || 0;
  const totalRent = selectedTool ? selectedTool.dailyRent * daysDiff : 0;
  const totalAmount = totalDeposit + totalRent;

  const canSubmit = selectedToolId && startDate && endDate && purpose.trim() && !currentUser.isBlacklisted;

  const handleSubmit = () => {
    if (!canSubmit || !selectedTool) return;

    setSubmitting(true);

    setTimeout(() => {
      addReservation({
        toolId: selectedTool.id,
        toolName: selectedTool.name,
        toolImage: selectedTool.image,
        startDate: startDate!,
        endDate: endDate!,
        timeSlot,
        purpose: purpose.trim(),
        totalDeposit,
        totalRent,
      });

      setSubmitting(false);
      setShowSuccessModal(true);
    }, 1000);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/records');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">预约借用</h1>
        <p className="text-sm text-gray-500">填写预约信息，物业将在24小时内审核</p>
      </div>

      {currentUser.isBlacklisted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">您当前处于黑名单中，无法提交预约</p>
            <p className="text-xs text-red-600 mt-1">
              原因: {currentUser.blacklistReason}
              {currentUser.blacklistExpiry && ` · 解除时间: ${formatDateTime(currentUser.blacklistExpiry)}`}
            </p>
          </div>
        </div>
      )}

      {myPendingReservations.length >= 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">您已有 {myPendingReservations.length} 个待处理预约</p>
            <p className="text-xs text-amber-600 mt-1">
              为了公平使用，每位业主最多可同时有3个待处理预约。请先完成或取消现有预约后再提交新的预约。
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900">选择工具</h3>
            </Card.Header>
            <Card.Content>
              {selectedTool ? (
                <div className="flex items-center gap-4">
                  <img
                    src={selectedTool.image}
                    alt={selectedTool.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-medium text-gray-900">{selectedTool.name}</h4>
                      <Badge variant="primary">{selectedTool.categoryName}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{selectedTool.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>可借 {selectedTool.availableStock}/{selectedTool.totalStock} 件</span>
                      <span>日租金 ¥{selectedTool.dailyRent}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToolSelector(true)}
                  >
                    更换
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowToolSelector(true)}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                    <CalendarIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">点击选择借用工具</p>
                  <p className="text-xs text-gray-500">从工具目录中选择需要借用的工具</p>
                </button>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900">选择日期</h3>
            </Card.Header>
            <Card.Content>
              <Calendar
                onDateSelect={handleDateSelect}
                selectedStartDate={startDate || undefined}
                selectedEndDate={endDate || undefined}
              />
              {startDate && endDate && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    已选择: <span className="font-medium">{startDate}</span> 至{' '}
                    <span className="font-medium">{endDate}</span>，共{' '}
                    <span className="font-medium">{daysDiff}</span> 天
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900">选择时段</h3>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.key}
                    onClick={() => setTimeSlot(slot.key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      timeSlot === slot.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock
                        className={`w-4 h-4 ${
                          timeSlot === slot.key ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          timeSlot === slot.key ? 'text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        {slot.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{slot.desc}</p>
                  </button>
                ))}
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900">借用事由</h3>
            </Card.Header>
            <Card.Content>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="请简要说明借用工具的用途，例如：家里安装置物架需要钻孔..."
                rows={4}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{purpose.length}/200</p>
            </Card.Content>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900">费用明细</h3>
            </Card.Header>
            <Card.Content className="space-y-4">
              {selectedTool ? (
                <>
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <img
                      src={selectedTool.image}
                      alt={selectedTool.name}
                      className="w-14 h-14 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {selectedTool.name}
                      </h4>
                      <p className="text-xs text-gray-500">{getTimeSlotLabel(timeSlot)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">借用天数</span>
                      <span className="text-gray-900">{daysDiff} 天</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">日租金</span>
                      <span className="text-gray-900">¥{selectedTool.dailyRent}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">租金合计</span>
                      <span className="text-gray-900">¥{totalRent}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">押金</span>
                      <span className="text-gray-900">¥{totalDeposit}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-base font-semibold text-gray-900">总计</span>
                      <span className="text-2xl font-bold text-orange-600">¥{totalAmount}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      * 押金将在工具完好归还后1-3个工作日内退还
                    </p>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={handleSubmit}
                      loading={submitting}
                      disabled={!canSubmit || myPendingReservations.length >= 3}
                    >
                      提交预约申请
                    </Button>
                    {(!selectedToolId || !startDate || !endDate || !purpose.trim()) && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        请完善所有预约信息
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">请先选择借用工具</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showToolSelector}
        onClose={() => setShowToolSelector(false)}
        title="选择工具"
        size="xl"
      >
        <div className="space-y-4">
          <Input placeholder="搜索工具名称..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {availableTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedToolId(tool.id);
                  setShowToolSelector(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  selectedToolId === tool.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={tool.image}
                  alt={tool.name}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{tool.name}</h4>
                  <p className="text-xs text-gray-500 mb-1 line-clamp-1">{tool.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="primary">{tool.categoryName}</Badge>
                    <span className="text-gray-500">¥{tool.dailyRent}/天</span>
                    <span className="text-emerald-600">可借 {tool.availableStock} 件</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title=""
        size="sm"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">预约提交成功</h3>
          <p className="text-sm text-gray-500 mb-6">
            您的预约申请已提交，物业将在24小时内审核。审核通过后请按时到物业服务中心扫码取件。
          </p>
          <div className="space-y-2">
            <Button variant="primary" className="w-full" onClick={handleSuccessClose}>
              查看预约记录
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowSuccessModal(false)}>
              返回首页
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
