import { useState, useMemo } from 'react';
import { Scan, LogIn, LogOut, AlertTriangle, CheckCircle2, XCircle, Package, AlertCircle, Flag } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDateTime, getStatusLabel, getStatusColor, isExpiringSoon } from '@/utils/date';
import { BorrowRecord, Reservation, DamageSeverity } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import Modal from '@/components/common/Modal';
import QRCodeScanner from '@/components/features/QRCodeScanner';
import StatusTag from '@/components/common/StatusTag';
import Input from '@/components/common/Input';

export default function BorrowRecords() {
  const {
    getMyReservations, getMyBorrowRecords, getExpiringSoonCount, currentUser, cancelReservation, approveReservation, rejectReservation, borrowRecords, reservations, isAdminView, tools, borrowTool } = useAppStore();

  const [showBorrowScanner, setShowBorrowScanner] = useState(false);
  const [showReturnScanner, setShowReturnScanner] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageSeverity, setDamageSeverity] = useState<DamageSeverity>('minor');
  const [damageAmount, setDamageAmount] = useState(0);
  const [activeTab, setActiveTab] = useState('reservations');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const myReservations = getMyReservations();
  const myBorrowRecords = getMyBorrowRecords();
  const expiringSoonCount = getExpiringSoonCount();

  const displayReservations = isAdminView ? reservations : myReservations;
  const displayRecords = isAdminView ? borrowRecords : myBorrowRecords;

  const pendingReservations = displayReservations.filter((r) => r.status === 'pending');
  const activeReservations = displayReservations.filter((r) => r.status === 'approved');
  const borrowedReservations = displayReservations.filter((r) => r.status === 'borrowed');
  const borrowedRecords = displayRecords.filter((r) => r.status === 'borrowed');
  const returnedRecords = displayRecords.filter((r) => r.status === 'returned');

  const handleReturnWithDamage = () => {
    if (!selectedRecord) return;

    useAppStore.getState().returnTool(selectedRecord.id, {
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

  const reservationTabs = [
    {
      key: 'reservations',
      label: `预约申请 (${pendingReservations.length})`,
      content: (
        <div className="space-y-4">
          {pendingReservations.length > 0 ? (
            pendingReservations.map((reservation) => (
            <ReservationItem
              key={reservation.id}
              reservation={reservation}
              isAdmin={isAdminView}
              onApprove={() => approveReservation(reservation.id)}
              onReject={() => rejectReservation(reservation.id, '工具已被预约')}
              onCancel={() => cancelReservation(reservation.id)}
            />
          ))
        ) : (
            <EmptyState icon={Package} text="暂无待审核预约" />
          )}
        </div>
      ),
    },
    {
      key: 'approved',
      label: `已通过 (${activeReservations.length})`,
      content: (
        <div className="space-y-4">
          {activeReservations.length > 0 ? (
            activeReservations.map((reservation) => (
            <ReservationItem
              key={reservation.id}
              reservation={reservation}
              isAdmin={isAdminView}
              onBorrow={() => {
                if (isAdminView) {
                  const success = useAppStore.getState().borrowTool(reservation.toolId, reservation.id);
                  if (success) {
                    showToast('success', `已确认借出「${reservation.toolName}」`);
                  } else {
                    showToast('error', '借出失败，请检查工具库存或预约状态');
                  }
                }
              }}
            />
          ))
        ) : (
            <EmptyState icon={CheckCircle2} text="暂无已通过预约" />
          )}
        </div>
      ),
    },
    {
      key: 'borrowed-reservations',
      label: `借用中 (${borrowedReservations.length})`,
      content: (
        <div className="space-y-4">
          {borrowedReservations.length > 0 ? (
            borrowedReservations.map((reservation) => (
            <ReservationItem
              key={reservation.id}
              reservation={reservation}
              isAdmin={isAdminView}
            />
          ))
        ) : (
            <EmptyState icon={LogIn} text="暂无借用中预约" />
          )}
        </div>
      ),
    },
    {
      key: 'borrowed-records',
      label: `借用记录 (${borrowedRecords.length})`,
      content: (
        <div className="space-y-4">
          {borrowedRecords.length > 0 ? (
            borrowedRecords.map((record) => (
            <BorrowRecordItem
              key={record.id}
              record={record}
              isAdmin={isAdminView}
              onReturn={() => openDamageModal(record)}
              onReturnNormal={() => useAppStore.getState().returnTool(record.id)}
            />
          ))
        ) : (
            <EmptyState icon={LogOut} text="暂无借用中记录" />
          )}
        </div>
      ),
    },
    {
      key: 'returned',
      label: `已归还 (${returnedRecords.length})`,
      content: (
        <div className="space-y-4">
          {returnedRecords.length > 0 ? (
            returnedRecords.map((record) => (
            <BorrowRecordItem
              key={record.id}
              record={record}
              isAdmin={isAdminView}
            />
          ))
        ) : (
            <EmptyState icon={CheckCircle2} text="暂无已归还记录" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">借还记录</h1>
          <p className="text-sm text-gray-500">
            {isAdminView ? '管理所有借还记录' : '查看您的预约和借还记录'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => setShowBorrowScanner(true)}
          >
            <LogIn className="w-4 h-4 mr-2" />
            扫码借出
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowReturnScanner(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            扫码归还
          </Button>
        </div>
      </div>

      {expiringSoonCount > 0 && (
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
            defaultKey="reservations"
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDamageModal(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleReturnWithDamage}
              disabled={!damageDescription.trim()}
            >
              <Flag className="w-4 h-4 mr-2" />
              确认损坏并归还
            </Button>
          </div>
        </div>
      </Modal>

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

function ReservationItem({
  reservation,
  isAdmin,
  onApprove,
  onReject,
  onCancel,
  onBorrow,
}: {
  reservation: Reservation;
  isAdmin: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onBorrow?: () => void;
}) {
  return (
    <Card hover>
      <Card.Content className="p-4">
        <div className="flex items-start gap-4">
          <img
            src={reservation.toolImage}
            alt={reservation.toolName}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {reservation.toolName}
                  </h4>
                  <StatusTag status={reservation.status} />
                </div>
                {isAdmin && (
                  <p className="text-xs text-gray-500 mb-1">
                    预约人: {reservation.userName} · {reservation.roomNumber}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>
                    {reservation.startDate} ~ {reservation.endDate}
                  </span>
                  <span>押金 ¥{reservation.totalDeposit}</span>
                  <span className="text-orange-600">租金 ¥{reservation.totalRent}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  事由: {reservation.purpose}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {isAdmin && reservation.status === 'pending' && (
                <>
                  <Button size="sm" variant="primary" onClick={onApprove}>
                    通过
                  </Button>
                  <Button size="sm" variant="outline" onClick={onReject}>
                    拒绝
                  </Button>
                </>
              )}
              {isAdmin && reservation.status === 'approved' && (
                <Button size="sm" variant="secondary" onClick={onBorrow}>
                  确认借出
                </Button>
              )}
              {!isAdmin && reservation.status === 'pending' && (
                <Button size="sm" variant="outline" onClick={onCancel}>
                  取消预约
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function BorrowRecordItem({
  record,
  isAdmin,
  onReturn,
  onReturnNormal,
}: {
  record: BorrowRecord;
  isAdmin: boolean;
  onReturn?: () => void;
  onReturnNormal?: () => void;
}) {
  const isExpiring = record.status === 'borrowed' && isExpiringSoon(record.expectedReturnAt);

  return (
    <Card hover>
      <Card.Content className="p-4">
        <div className="flex items-start gap-4">
          <img
            src={record.toolImage}
            alt={record.toolName}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {record.toolName}
                  </h4>
                  <StatusTag status={record.status} />
                  {isExpiring && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      即将到期
                    </Badge>
                  )}
                  {record.damageReport && (
                    <Badge variant="danger" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      有损坏
                    </Badge>
                  )}
                </div>
                {isAdmin && (
                  <p className="text-xs text-gray-500 mb-1">
                    借用人: {record.userName} · {record.roomNumber}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>借出: {formatDateTime(record.borrowAt)}</span>
                  <span>应还: {formatDateTime(record.expectedReturnAt)}</span>
                  {record.actualReturnAt && (
                    <span>实还: {formatDateTime(record.actualReturnAt)}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                  <span className="text-gray-500">押金 ¥{record.depositPaid}</span>
                  <span className="text-orange-600">租金 ¥{record.rentPaid}</span>
                  {record.damageReport && (
                    <span className="text-red-600">
                      赔偿 ¥{record.damageReport.compensationAmount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {record.status === 'borrowed' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {isAdmin && (
                  <>
                    <Button size="sm" variant="primary" onClick={onReturnNormal}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      完好归还
                    </Button>
                    <Button size="sm" variant="danger" onClick={onReturn}>
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      损坏上报
                    </Button>
                  </>
                )}
              </div>
            )}

            {record.damageReport && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-700">
                  <span className="font-medium">损坏说明: </span>
                  {record.damageReport.description}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  赔偿金额: ¥{record.damageReport.compensationAmount}
                  {record.damageReport.isPaid ? ' (已支付)' : ' (待支付)'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
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
