import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LogIn, LogOut, AlertTriangle, CheckCircle2, XCircle, Package, AlertCircle,
  Flag, Search, Filter, Download, Calendar, Users, Wrench, X,
  Clock, DollarSign, FileText, ChevronRight, Check, Ban, ArrowLeft
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  formatDateTime, formatDate, getStatusLabel, getStatusColor, isExpiringSoon
} from '@/utils/date';
import {
  BorrowRecord, Reservation, DamageSeverity, TimeSlot
} from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import Modal from '@/components/common/Modal';
import QRCodeScanner from '@/components/features/QRCodeScanner';
import StatusTag from '@/components/common/StatusTag';
import Input from '@/components/common/Input';

const TIMESLOT_LABEL: Record<TimeSlot, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
  fullday: '全天',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'borrowed', label: '借用中' },
  { value: 'returned', label: '已归还' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'cancelled', label: '已取消' },
];

type RecordUnion = Reservation | BorrowRecord;
type DetailItem =
  | (Reservation & { kind: 'reservation' })
  | (BorrowRecord & { kind: 'record' })
  | null;

export default function BorrowRecords() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { activeTab?: string; taskMode?: boolean };
  };
  const {
    getMyReservations, getMyBorrowRecords, getExpiringSoonCount,
    currentUser, cancelReservation, approveReservation, rejectReservation,
    borrowRecords, reservations, isAdminView, tools, borrowTool,
    returnTool, payCompensation,
  } = useAppStore();

  const [showBorrowScanner, setShowBorrowScanner] = useState(false);
  const [showReturnScanner, setShowReturnScanner] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageSeverity, setDamageSeverity] = useState<DamageSeverity>('minor');
  const [damageAmount, setDamageAmount] = useState(0);
  const [activeTab, setActiveTab] = useState('pending');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [detailItem, setDetailItem] = useState<DetailItem>(null);

  const [filterUser, setFilterUser] = useState('');
  const [filterToolId, setFilterToolId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [taskMode, setTaskMode] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      const t = location.state.activeTab;
      setActiveTab(t || 'pending');
      setTaskMode(!!location.state?.taskMode);
    }
  }, [location.state]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const myReservations = getMyReservations();
  const myBorrowRecords = getMyBorrowRecords();
  const expiringSoonCount = getExpiringSoonCount();

  const displayReservations = isAdminView ? reservations : myReservations;
  const displayRecords = isAdminView ? borrowRecords : myBorrowRecords;

  const allRecords = useMemo(() => {
    const combined: Array<Reservation | BorrowRecord> = [
      ...displayReservations,
      ...displayRecords,
    ];
    return combined;
  }, [displayReservations, displayRecords]);

  const filteredAllRecords = useMemo(() => {
    let records = allRecords;
    if (filterUser.trim()) {
      const keyword = filterUser.trim().toLowerCase();
      records = records.filter(
        (r) =>
          'userName' in r &&
          (r.userName.toLowerCase().includes(keyword) ||
            r.roomNumber.toLowerCase().includes(keyword))
      );
    }
    if (filterToolId) {
      records = records.filter((r) => r.toolId === filterToolId);
    }
    if (filterStatus) {
      records = records.filter((r) => r.status === filterStatus);
    }
    if (dateStart) {
      records = records.filter((r) => {
        const date = 'startDate' in r ? r.startDate : r.borrowAt;
        return date >= dateStart;
      });
    }
    if (dateEnd) {
      records = records.filter((r) => {
        const date = 'endDate' in r
          ? r.endDate
          : (r.actualReturnAt || r.expectedReturnAt);
        return date <= dateEnd;
      });
    }
    return records;
  }, [allRecords, filterUser, filterToolId, filterStatus, dateStart, dateEnd]);

  const baseReservations = filteredAllRecords.filter(
    (r): r is Reservation => 'startDate' in r
  );
  const baseBorrowedRecords = filteredAllRecords.filter(
    (r): r is BorrowRecord => 'borrowAt' in r
  );

  const pendingReservations = baseReservations.filter((r) => r.status === 'pending');
  const activeReservations = baseReservations.filter((r) => r.status === 'approved');
  const borrowedReservations = baseReservations.filter((r) => r.status === 'borrowed');
  const borrowedRecords = baseBorrowedRecords.filter((r) => r.status === 'borrowed');
  const returnedRecords = baseBorrowedRecords.filter((r) => r.status === 'returned');

  const overdueRecords = useMemo(() => {
    const now = new Date();
    return baseBorrowedRecords.filter(
      (r) => r.status === 'borrowed' && new Date(r.expectedReturnAt) < now
    );
  }, [baseBorrowedRecords]);

  const unpaidCompensations = useMemo(() => {
    return baseBorrowedRecords.filter(
      (r) => r.damageReport && !r.damageReport.isPaid
    );
  }, [baseBorrowedRecords]);

  const hasActiveFilters =
    filterUser || filterToolId || filterStatus || dateStart || dateEnd;

  // ============= 导出功能 =============
  const exportAllData = (scope: 'current' | 'all') => {
    let records: RecordUnion[] = [];
    if (scope === 'current') {
      switch (activeTab) {
        case 'pending':
          records = pendingReservations;
          break;
        case 'approved':
          records = activeReservations;
          break;
        case 'borrowed-reservations':
          records = borrowedReservations;
          break;
        case 'borrowed-records':
          records = borrowedRecords;
          break;
        case 'returned':
          records = returnedRecords;
          break;
        case 'overdue':
          records = overdueRecords;
          break;
        case 'unpaid':
          records = unpaidCompensations;
          break;
        default:
          records = filteredAllRecords;
      }
    } else {
      records = filteredAllRecords;
    }

    const headers = [
      '住户姓名', '房间号', '工具名称',
      '预约日期(起)', '预约日期(止)',
      '实际借出时间', '预计归还时间', '实际归还时间',
      '押金(元)', '租金(元)',
      '状态',
      '损坏描述', '损坏程度', '赔偿金额(元)', '是否已赔付',
      '提交预约时间', '操作事由',
    ];

    const severityMap = { minor: '轻微', moderate: '中度', severe: '严重' };

    const rows = records.map((r) => {
      const isRes = 'startDate' in r;
      return [
        r.userName,
        r.roomNumber,
        r.toolName,
        isRes ? r.startDate : '',
        isRes ? r.endDate : '',
        isRes ? '' : formatDate(r.borrowAt),
        isRes ? '' : formatDate(r.expectedReturnAt),
        (isRes || !r.actualReturnAt) ? '' : formatDate(r.actualReturnAt),
        isRes ? r.totalDeposit : r.depositPaid,
        isRes ? r.totalRent : r.rentPaid,
        getStatusLabel(r.status),
        (!isRes && r.damageReport) ? r.damageReport.description : '',
        (!isRes && r.damageReport) ? severityMap[r.damageReport.severity] : '',
        (!isRes && r.damageReport) ? r.damageReport.compensationAmount : '',
        (!isRes && r.damageReport) ? (r.damageReport.isPaid ? '是' : '否') : '',
        isRes ? formatDate(r.createdAt) : (isRes ? '' : ''),
        isRes ? r.purpose : '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const tabLabels: Record<string, string> = {
      pending: '待审核', approved: '待借出',
      'borrowed-reservations': '借用中预约',
      'borrowed-records': '待归还',
      returned: '已归还', overdue: '逾期未还',
      unpaid: '赔付待处理',
    };
    const suffix = scope === 'current'
      ? `_${tabLabels[activeTab] || '当前页签'}`
      : '_全部';
    link.download = `借还台账_${formatDate(new Date().toISOString())}${suffix}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    showToast('success', `已导出 ${rows.length} 条记录`);
  };

  // ============= 操作回调 =============
  const handleReturnWithDamage = () => {
    if (!selectedRecord) return;
    returnTool(selectedRecord.id, {
      description: damageDescription,
      severity: damageSeverity,
      photos: [],
      compensationAmount: damageAmount,
      isPaid: false,
    });
    setShowDamageModal(false);
    setSelectedRecord(null);
    setDamageDescription('');
    setDamageSeverity('minor');
    setDamageAmount(0);
  };

  const openDamageModal = (record: BorrowRecord) => {
    setSelectedRecord(record);
    setShowDamageModal(true);
  };

  const openDetail = (item: RecordUnion) => {
    setDetailItem({
      ...item,
      kind: 'startDate' in item ? 'reservation' : 'record',
    } as DetailItem);
  };

  // ============= 构建Tabs =============
  const buildTabItem = (
    key: string,
    label: string,
    count: number,
    list: RecordUnion[],
    renderActions?: (item: RecordUnion) => React.ReactNode,
  ) => ({
    key,
    label: `${label} (${count})`,
    content: (
      <div className="space-y-4">
        {list.length > 0 ? (
          list.map((item) => {
            const isRes = 'startDate' in item;
            return (
              <div key={item.id + (isRes ? '-r' : '-b')}>
                <Card
                  hover
                  onClick={() => openDetail(item)}
                  className="cursor-pointer"
                >
                  <Card.Content className="p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={item.toolImage}
                        alt={item.toolName}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {item.toolName}
                              </h4>
                              <StatusTag status={item.status} />
                              {!isRes && item.status === 'borrowed' &&
                                isExpiringSoon(item.expectedReturnAt) && (
                                  <Badge variant="warning" className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    即将到期
                                  </Badge>
                                )}
                              {key === 'overdue' && (
                                <Badge variant="danger">逾期</Badge>
                              )}
                              {!isRes && item.damageReport && !item.damageReport.isPaid && (
                                <Badge variant="danger">待赔付</Badge>
                              )}
                            </div>
                            {isAdminView && (
                              <p className="text-xs text-gray-500 mb-1">
                                {isRes ? '预约人' : '借用人'}: {item.userName} · {item.roomNumber}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                              {isRes ? (
                                <>
                                  <span>预约: {item.startDate} ~ {item.endDate}</span>
                                  <span>押金 ¥{item.totalDeposit}</span>
                                  <span className="text-orange-600">租金 ¥{item.totalRent}</span>
                                </>
                              ) : (
                                <>
                                  <span>借出: {formatDate(item.borrowAt)}</span>
                                  <span>应还: {formatDate(item.expectedReturnAt)}</span>
                                  {item.actualReturnAt && (
                                    <span>实还: {formatDate(item.actualReturnAt)}</span>
                                  )}
                                </>
                              )}
                            </div>
                            {isRes && (
                              <p className="text-xs text-gray-400 mt-1">
                                事由: {item.purpose}
                              </p>
                            )}
                            {!isRes && (
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                                <span className="text-gray-500">押金 ¥{item.depositPaid}</span>
                                <span className="text-orange-600">租金 ¥{item.rentPaid}</span>
                                {item.damageReport && (
                                  <span className="text-red-600">
                                    赔偿 ¥{item.damageReport.compensationAmount}
                                    {item.damageReport.isPaid ? ' (已付)' : ' (待付)'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className="flex flex-wrap gap-2 mt-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderActions?.(item)}
                        </div>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>
            );
          })
        ) : (
          <EmptyState icon={Package} text={`暂无${label}记录`} />
        )}
      </div>
    ),
  });

  const reservationTabs = [
    buildTabItem(
      'pending', '待审核', pendingReservations.length, pendingReservations,
      (item) => {
        const r = item as Reservation;
        if (!isAdminView) {
          return (
            <Button
              size="sm" variant="outline"
              onClick={() => cancelReservation(r.id)}
            >
              取消预约
            </Button>
          );
        }
        return (
          <>
            <Button
              size="sm" variant="primary"
              onClick={() => { approveReservation(r.id); showToast('success', `已通过「${r.toolName}」的预约`); }}
            >
              <Check className="w-3 h-3 mr-1" />通过
            </Button>
            <Button
              size="sm" variant="outline"
              onClick={() => { rejectReservation(r.id, '不符合借用要求'); showToast('success', '已拒绝预约'); }}
            >
              <Ban className="w-3 h-3 mr-1" />拒绝
            </Button>
          </>
        );
      },
    ),
    buildTabItem(
      'approved', '待借出', activeReservations.length, activeReservations,
      (item) => {
        const r = item as Reservation;
        if (!isAdminView) return null;
        return (
          <Button
            size="sm" variant="secondary"
            onClick={() => {
              const ok = borrowTool(r.toolId, r.id);
              showToast(ok ? 'success' : 'error', ok
                ? `已确认借出「${r.toolName}」`
                : '借出失败，请检查工具库存或预约状态');
            }}
          >
            <LogIn className="w-3 h-3 mr-1" />确认借出
          </Button>
        );
      },
    ),
    buildTabItem(
      'borrowed-records', '待归还', borrowedRecords.length, borrowedRecords,
      (item) => {
        const rec = item as BorrowRecord;
        if (!isAdminView) return null;
        return (
          <>
            <Button
              size="sm" variant="primary"
              onClick={() => {
                returnTool(rec.id);
                showToast('success', `「${rec.toolName}」已完好归还`);
              }}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />完好归还
            </Button>
            <Button
              size="sm" variant="danger"
              onClick={() => openDamageModal(rec)}
            >
              <AlertTriangle className="w-3 h-3 mr-1" />损坏上报
            </Button>
          </>
        );
      },
    ),
    ...(isAdminView ? [
      buildTabItem(
        'overdue', '逾期未还', overdueRecords.length, overdueRecords,
        (item) => {
          const rec = item as BorrowRecord;
          return (
            <>
              <Badge variant="danger">
                逾期 {Math.ceil((Date.now() - new Date(rec.expectedReturnAt).getTime()) / 86400000)} 天
              </Badge>
              <Button
                size="sm" variant="primary"
                onClick={() => {
                  returnTool(rec.id);
                  showToast('success', `「${rec.toolName}」已完好归还`);
                }}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />完好归还
              </Button>
              <Button
                size="sm" variant="danger"
                onClick={() => openDamageModal(rec)}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />损坏上报
              </Button>
            </>
          );
        },
      ),
      buildTabItem(
        'unpaid', '赔付待处理', unpaidCompensations.length, unpaidCompensations,
        (item) => {
          const rec = item as BorrowRecord;
          if (!rec.damageReport) return null;
          return (
            <>
              <Badge variant="danger">
                ¥{rec.damageReport.compensationAmount}
              </Badge>
              {!rec.damageReport.isPaid && (
                <Button
                  size="sm" variant="success"
                  onClick={() => {
                    payCompensation(rec.id);
                    showToast('success', '已标记赔付完成');
                  }}
                >
                  <DollarSign className="w-3 h-3 mr-1" />标记已赔付
                </Button>
              )}
            </>
          );
        },
      ),
    ] : []),
    buildTabItem(
      'borrowed-reservations', '借用中预约', borrowedReservations.length,
      borrowedReservations,
    ),
    buildTabItem(
      'returned', '已归还', returnedRecords.length, returnedRecords,
    ),
  ];

  const clearFilters = () => {
    setFilterUser('');
    setFilterToolId('');
    setFilterStatus('');
    setDateStart('');
    setDateEnd('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {taskMode && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" /> 返回工作台
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {taskMode ? '待办处理' : '借还台账'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isAdminView
              ? taskMode ? '集中处理今日待办事项，处理完毕后数字自动更新' : '管理所有住户的预约、借还和赔付记录'
              : '查看您的预约和借还记录'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdminView && (
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          )}
          {isAdminView && (
            <>
              <Button variant="primary" onClick={() => setShowBorrowScanner(true)}>
                <LogIn className="w-4 h-4 mr-2" />
                扫码借出
              </Button>
              <Button variant="secondary" onClick={() => setShowReturnScanner(true)}>
                <LogOut className="w-4 h-4 mr-2" />
                扫码归还
              </Button>
            </>
          )}
        </div>
      </div>

      {isAdminView && (
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">筛选条件</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  清除全部
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索住户..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-gray-400" />
                <select
                  value={filterToolId}
                  onChange={(e) => setFilterToolId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">全部工具</option>
                  {tools.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <StatusTag status="approved" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                当前筛选结果: 共 {filteredAllRecords.length} 条记录
                {activeTab && (
                  <span className="ml-2">
                    · 当前页签: {
                      reservationTabs.find(t => t.key === activeTab)?.label
                    }
                  </span>
                )}
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {!isAdminView && expiringSoonCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              您有 {expiringSoonCount} 件工具即将到期
            </p>
            <p className="text-xs text-amber-600 mt-1">
              请按时归还，避免产生逾期费用
            </p>
          </div>
        </div>
      )}

      <Card>
        <Card.Content className="p-0">
          <Tabs
            items={reservationTabs}
            defaultKey="pending"
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </Card.Content>
      </Card>

      <QRCodeScanner
        type="borrow"
        isOpen={showBorrowScanner}
        onClose={() => setShowBorrowScanner(false)}
      />
      <QRCodeScanner
        type="return"
        isOpen={showReturnScanner}
        onClose={() => setShowReturnScanner(false)}
      />

      {/* ========== 损坏上报 ========== */}
      <Modal
        isOpen={showDamageModal}
        onClose={() => setShowDamageModal(false)}
        title="损坏上报"
        size="md"
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={selectedRecord.toolImage}
                alt={selectedRecord.toolName}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {selectedRecord.toolName}
                </h4>
                <p className="text-xs text-gray-500">
                  借用时间: {formatDateTime(selectedRecord.borrowAt)}
                </p>
                <p className="text-xs text-gray-500">
                  借用人: {selectedRecord.userName} · {selectedRecord.roomNumber}
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              损坏程度
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'minor' as DamageSeverity, label: '轻微', color: 'bg-emerald-100 text-emerald-700' },
                { key: 'moderate' as DamageSeverity, label: '中度', color: 'bg-amber-100 text-amber-700' },
                { key: 'severe' as DamageSeverity, label: '严重', color: 'bg-red-100 text-red-700' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setDamageSeverity(item.key)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    damageSeverity === item.key
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
              损坏描述
            </label>
            <textarea
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              placeholder="请详细描述工具的损坏情况..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预估赔偿金额
            </label>
            <Input
              type="number"
              value={damageAmount}
              onChange={(e) => setDamageAmount(Number(e.target.value))}
              placeholder="请输入预估赔偿金额"
              prefix="¥"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowDamageModal(false)}>
              取消
            </Button>
            <Button
              variant="danger" className="flex-1"
              onClick={handleReturnWithDamage}
              disabled={!damageDescription.trim()}
            >
              <Flag className="w-4 h-4 mr-2" />
              确认损坏并归还
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========== 导出选择 ========== */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出借还台账"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            当前筛选结果共 {filteredAllRecords.length} 条记录，请选择导出范围：
          </p>
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => exportAllData('current')}
            >
              <FileText className="w-4 h-4 mr-2" />
              仅导出当前页签
              <span className="ml-auto text-xs text-gray-400">
                {reservationTabs.find(t => t.key === activeTab)?.label}
              </span>
            </Button>
            <Button
              className="w-full justify-start"
              variant="primary"
              onClick={() => exportAllData('all')}
            >
              <Download className="w-4 h-4 mr-2" />
              导出全部筛选结果
              <span className="ml-auto text-xs opacity-80">
                共 {filteredAllRecords.length} 条
              </span>
            </Button>
          </div>
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            导出字段包括：住户、工具、各阶段日期、押金、租金、损坏赔付、状态等信息
          </div>
        </div>
      </Modal>

      {/* ========== 记录详情侧栏 ========== */}
      {detailItem && (
        <DetailDrawer
          item={detailItem}
          isAdmin={isAdminView}
          onClose={() => setDetailItem(null)}
          onPayCompensation={(id) => { payCompensation(id); }}
          onReturnNormal={(id) => { returnTool(id); showToast('success', '工具已归还'); }}
          onReturnWithDamage={openDamageModal}
          onApprove={(id) => { approveReservation(id); showToast('success', '预约已通过'); }}
          onReject={(id) => { rejectReservation(id, ''); showToast('success', '预约已拒绝'); }}
          onBorrow={(toolId, resId) => {
            const ok = borrowTool(toolId, resId);
            showToast(ok ? 'success' : 'error', ok ? '已确认借出' : '借出失败');
          }}
        />
      )}

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// ================== 详情侧栏 ==================
function DetailDrawer({
  item, isAdmin, onClose,
  onPayCompensation, onReturnNormal, onReturnWithDamage,
  onApprove, onReject, onBorrow,
}: {
  item: NonNullable<DetailItem>;
  isAdmin: boolean;
  onClose: () => void;
  onPayCompensation: (id: string) => void;
  onReturnNormal: (id: string) => void;
  onReturnWithDamage: (r: BorrowRecord) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onBorrow: (toolId: string, reservationId: string) => void;
}) {
  const severityMap = { minor: '轻微', moderate: '中度', severe: '严重' };
  const isRes = item.kind === 'reservation';
  const timeline = useMemo(() => {
    const items: { date: string; label: string; color: string; icon: string }[] = [];
    if (isRes) {
      items.push({ date: formatDateTime(item.createdAt), label: '提交预约申请', color: 'bg-blue-500', icon: '📝' });
      if (item.status === 'approved') {
        items.push({ date: '—', label: '预约审核通过', color: 'bg-green-500', icon: '✅' });
      } else if (item.status === 'rejected') {
        items.push({ date: '—', label: '预约被拒绝', color: 'bg-red-500', icon: '❌' });
      } else if (item.status === 'cancelled') {
        items.push({ date: '—', label: '住户已取消预约', color: 'bg-gray-400', icon: '🚫' });
      } else if (item.status === 'borrowed') {
        items.push({ date: '—', label: '预约审核通过', color: 'bg-green-500', icon: '✅' });
        items.push({ date: '—', label: '工具已借出', color: 'bg-indigo-500', icon: '📦' });
      }
    } else {
      items.push({ date: formatDateTime(item.borrowAt), label: '工具借出确认', color: 'bg-indigo-500', icon: '📦' });
      if (item.actualReturnAt) {
        items.push({ date: formatDateTime(item.actualReturnAt), label: '工具归还', color: 'bg-green-500', icon: '↩️' });
      } else {
        items.push({ date: `应还: ${formatDate(item.expectedReturnAt)}`, label: '预计归还日期', color: 'bg-amber-400', icon: '⏰' });
      }
      if (item.damageReport) {
        items.push({
          date: '—',
          label: `损坏上报: ${severityMap[item.damageReport.severity]} · ¥${item.damageReport.compensationAmount}${item.damageReport.isPaid ? ' (已付)' : ' (待付)'}`,
          color: 'bg-red-500', icon: '⚠️',
        });
      }
    }
    return items;
  }, [item, isRes]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">记录详情</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* 工具信息 */}
          <div className="flex gap-4">
            <img
              src={item.toolImage}
              alt={item.toolName}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-semibold text-gray-900">{item.toolName}</h4>
                <StatusTag status={item.status} />
              </div>
              {isAdmin && (
                <p className="text-xs text-gray-500 mt-1">
                  {(isRes ? '预约人' : '借用人')}: {item.userName} · {item.roomNumber}
                </p>
              )}
              {isRes && (
                <p className="text-xs text-gray-500 mt-1">
                  事由: {item.purpose}
                </p>
              )}
            </div>
          </div>

          {/* 费用明细 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">押金</p>
              <p className="text-lg font-bold text-blue-700">
                ¥{isRes ? item.totalDeposit : item.depositPaid}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">租金</p>
              <p className="text-lg font-bold text-orange-700">
                ¥{isRes ? item.totalRent : item.rentPaid}
              </p>
            </div>
            {!isRes && item.damageReport && (
              <div className="col-span-2 p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-500 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 损坏赔付
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">程度: </span>
                    {severityMap[item.damageReport.severity]} ·
                    <span className="font-medium"> 金额: </span>
                    ¥{item.damageReport.compensationAmount}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      item.damageReport.isPaid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.damageReport.isPaid ? '已支付' : '待支付'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    说明: {item.damageReport.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 关键日期 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h5 className="text-xs font-semibold text-gray-500 mb-2">关键时间点</h5>
            {isRes ? (
              <>
                <DateRow label="预约起止" value={`${item.startDate} ~ ${item.endDate}`} />
                <DateRow label="提交时间" value={formatDateTime(item.createdAt)} />
                <DateRow label="预约时段" value={TIMESLOT_LABEL[item.timeSlot]} />
              </>
            ) : (
              <>
                <DateRow label="实际借出" value={formatDateTime(item.borrowAt)} />
                <DateRow label="预计归还" value={formatDateTime(item.expectedReturnAt)} />
                {item.actualReturnAt ? (
                  <DateRow label="实际归还" value={formatDateTime(item.actualReturnAt)} />
                ) : (
                  <DateRow
                    label="状态"
                    value={
                      new Date(item.expectedReturnAt) < new Date()
                        ? '已逾期'
                        : '借用中'
                    }
                    highlight={new Date(item.expectedReturnAt) < new Date()}
                  />
                )}
              </>
            )}
          </div>

          {/* 操作时间线 */}
          <div>
            <h5 className="text-xs font-semibold text-gray-500 mb-3">操作进度</h5>
            <div className="relative ml-3 border-l-2 border-gray-200 pl-6 space-y-5">
              {timeline.map((t, idx) => (
                <div key={idx} className="relative">
                  <span className={`absolute -left-8 top-1 w-4 h-4 ${t.color} rounded-full flex items-center justify-center text-xs`}>
                    {t.icon}
                  </span>
                  <p className="text-sm font-medium text-gray-800">{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          {isAdmin && (
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <h5 className="text-xs font-semibold text-gray-500 mb-2">可用操作</h5>
              <div className="flex flex-wrap gap-2">
                {isRes && item.status === 'pending' && (
                  <>
                    <Button size="sm" variant="primary" onClick={() => onApprove(item.id)}>
                      <Check className="w-3 h-3 mr-1" />通过预约
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReject(item.id)}>
                      <Ban className="w-3 h-3 mr-1" />拒绝预约
                    </Button>
                  </>
                )}
                {isRes && item.status === 'approved' && (
                  <Button size="sm" variant="secondary" onClick={() => onBorrow(item.toolId, item.id)}>
                    <LogIn className="w-3 h-3 mr-1" />确认借出
                  </Button>
                )}
                {!isRes && item.status === 'borrowed' && (
                  <>
                    <Button size="sm" variant="primary" onClick={() => onReturnNormal(item.id)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />完好归还
                    </Button>
                    <Button
                      size="sm" variant="danger"
                      onClick={() => onReturnWithDamage(item as BorrowRecord)}
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />损坏上报
                    </Button>
                  </>
                )}
                {!isRes && item.damageReport && !item.damageReport.isPaid && (
                  <Button
                    size="sm" variant="success"
                    onClick={() => onPayCompensation(item.id)}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />标记已赔付
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DateRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? 'text-red-600 font-semibold' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
