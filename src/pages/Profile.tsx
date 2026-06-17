import { useState, useMemo } from 'react';
import { User, Package, CreditCard, AlertTriangle, History, Shield, Ban, CheckCircle, XCircle, Building2, Phone, Hash, TrendingUp, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, isExpiringSoon } from '@/utils/date';
import { BorrowRecord } from '@/types';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import StatusTag from '@/components/common/StatusTag';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';

export default function Profile() {
  const {
    currentUser,
    isAdminView,
    getMyBorrowRecords,
    getMyDeposits,
    getMyCompensations,
    getHotTools,
    borrowRecords,
    addBlacklist,
    removeBlacklist,
    toggleAdminView,
    tools,
    getOverdueCount,
    getExpiringSoonCount,
    getUnpaidCompensationCount,
  } = useAppStore();

  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistDays, setBlacklistDays] = useState(7);
  const [filterToolId, setFilterToolId] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const myRecords = getMyBorrowRecords();
  const myDeposits = getMyDeposits();
  const myCompensations = getMyCompensations();
  const hotTools = getHotTools();

  const overdueCount = getOverdueCount();
  const expiringSoonCount = getExpiringSoonCount();
  const unpaidCompensationCount = getUnpaidCompensationCount();

  const filteredRecords = useMemo(() => {
    let records = isAdminView ? borrowRecords : myRecords;
    if (isAdminView) {
      if (filterToolId) {
        records = records.filter((r) => r.toolId === filterToolId);
      }
      if (filterUser.trim()) {
        const keyword = filterUser.trim().toLowerCase();
        records = records.filter(
          (r) =>
            r.userName.toLowerCase().includes(keyword) ||
            r.roomNumber.toLowerCase().includes(keyword)
        );
      }
    }
    return records;
  }, [isAdminView, borrowRecords, myRecords, filterToolId, filterUser]);

  const totalBorrowed = filteredRecords.length;
  const totalDeposit = myDeposits.reduce((sum, d) => sum + d.amount, 0);
  const totalCompensation = myCompensations.reduce((sum, c) => sum + c.amount, 0);
  const pendingCompensation = myCompensations.filter((c) => c.status === '待支付').reduce((sum, c) => sum + c.amount, 0);

  const overdueRecords = useMemo(() => {
    const now = new Date();
    const base = isAdminView ? borrowRecords : myRecords;
    return base.filter((r) => r.status === 'borrowed' && new Date(r.expectedReturnAt) < now);
  }, [isAdminView, borrowRecords, myRecords]);

  const expiringRecords = useMemo(() => {
    const base = isAdminView ? borrowRecords : myRecords;
    return base.filter((r) => r.status === 'borrowed' && isExpiringSoon(r.expectedReturnAt));
  }, [isAdminView, borrowRecords, myRecords]);

  const unpaidCompensations = useMemo(() => {
    const base = isAdminView ? borrowRecords : myRecords;
    return base.filter((r) => r.damageReport && !r.damageReport.isPaid);
  }, [isAdminView, borrowRecords, myRecords]);

  const handleAddBlacklist = () => {
    if (!blacklistReason.trim()) return;
    addBlacklist(currentUser.id, blacklistReason, blacklistDays);
    setShowBlacklistModal(false);
    setBlacklistReason('');
    setBlacklistDays(7);
  };

  const profileTabs = [
    {
      key: 'history',
      label: '历史借用',
      content: (
        <div className="space-y-4">
          {isAdminView && (
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4 text-gray-400" />
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
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  placeholder="搜索住户姓名或房间号..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {(filterToolId || filterUser) && (
                <Button variant="outline" size="sm" onClick={() => { setFilterToolId(''); setFilterUser(''); }}>
                  清除筛选
                </Button>
              )}
            </div>
          )}

          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <Card key={record.id} hover>
                <Card.Content className="p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={record.toolImage}
                      alt={record.toolName}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {record.toolName}
                        </h4>
                        <StatusTag status={record.status} />
                        {record.damageReport && (
                          <Badge variant="danger" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            损坏
                          </Badge>
                        )}
                      </div>
                      {isAdminView && (
                        <p className="text-xs text-gray-500 mb-1">
                          借用人: {record.userName} · {record.roomNumber}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>借出: {formatDate(record.borrowAt)}</span>
                        <span>应还: {formatDate(record.expectedReturnAt)}</span>
                        {record.actualReturnAt && (
                          <span>实还: {formatDate(record.actualReturnAt)}</span>
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
                </Card.Content>
              </Card>
            ))
          ) : (
            <EmptyState icon={History} text="暂无借用记录" />
          )}
        </div>
      ),
    },
    {
      key: 'deposits',
      label: '押金记录',
      content: (
        <div className="space-y-4">
          {myDeposits.length > 0 ? (
            myDeposits.map((deposit, index) => (
              <Card key={index} hover>
                <Card.Content className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{deposit.toolName}</h4>
                        <p className="text-xs text-gray-500">{formatDate(deposit.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">¥{deposit.amount}</p>
                      <Badge variant={deposit.status === '已退还' ? 'success' : 'warning'}>
                        {deposit.status}
                      </Badge>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))
          ) : (
            <EmptyState icon={CreditCard} text="暂无押金记录" />
          )}
        </div>
      ),
    },
    {
      key: 'compensations',
      label: '赔付记录',
      content: (
        <div className="space-y-4">
          {myCompensations.length > 0 ? (
            myCompensations.map((compensation, index) => (
              <Card key={index} hover>
                <Card.Content className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">{compensation.toolName}</h4>
                        <p className="text-xs text-gray-500 mt-1">{compensation.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(compensation.date)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-red-600">¥{compensation.amount}</p>
                      <Badge variant={compensation.status === '已支付' ? 'success' : 'danger'}>
                        {compensation.status}
                      </Badge>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))
          ) : (
            <EmptyState icon={AlertTriangle} text="暂无赔付记录" />
          )}
        </div>
      ),
    },
  ];

  if (isAdminView) {
    profileTabs.push({
      key: 'admin',
      label: '管理统计',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <Card.Content className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                    <p className="text-xs text-gray-500">逾期未还</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <Card.Content className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{expiringSoonCount}</p>
                    <p className="text-xs text-gray-500">即将到期</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <Card.Content className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{unpaidCompensationCount}</p>
                    <p className="text-xs text-gray-500">赔付待处理</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {overdueRecords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                逾期未还清单
              </h3>
              <div className="space-y-2">
                {overdueRecords.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <img src={r.toolImage} alt="" className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.toolName}</p>
                      <p className="text-xs text-gray-500">{r.userName} · {r.roomNumber}</p>
                    </div>
                    <Badge variant="danger">逾期 {Math.ceil((Date.now() - new Date(r.expectedReturnAt).getTime()) / 86400000)} 天</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiringRecords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                即将到期清单
              </h3>
              <div className="space-y-2">
                {expiringRecords.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <img src={r.toolImage} alt="" className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.toolName}</p>
                      <p className="text-xs text-gray-500">{r.userName} · {r.roomNumber}</p>
                    </div>
                    <Badge variant="warning">即将到期</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unpaidCompensations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-orange-600" />
                赔付待处理清单
              </h3>
              <div className="space-y-2">
                {unpaidCompensations.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <img src={r.toolImage} alt="" className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.toolName}</p>
                      <p className="text-xs text-gray-500">{r.userName} · {r.roomNumber} · {r.damageReport?.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-orange-600">¥{r.damageReport?.compensationAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              热门工具排行
            </h3>
            <div className="space-y-3">
              {hotTools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-amber-100 text-amber-700'
                        : index === 1
                        ? 'bg-gray-200 text-gray-600'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <img
                    src={tool.image}
                    alt={tool.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{tool.name}</h4>
                    <p className="text-xs text-gray-500">{tool.categoryName} · {tool.buildingName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">{tool.borrowCount} 次</p>
                    <p className="text-xs text-gray-400">累计借用</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">个人中心</h1>
          <p className="text-sm text-gray-500">
            {isAdminView ? '管理后台信息' : '查看您的账户信息和借用记录'}
          </p>
        </div>
        <Button
          variant={isAdminView ? 'primary' : 'outline'}
          onClick={toggleAdminView}
        >
          <Shield className="w-4 h-4 mr-2" />
          {isAdminView ? '切换到居民视图' : '切换到管理员视图'}
        </Button>
      </div>

      {currentUser.isBlacklisted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <Ban className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              您当前处于黑名单中
            </p>
            <p className="text-xs text-red-600 mt-1">
              原因: {currentUser.blacklistReason}
            </p>
            {currentUser.blacklistExpiry && (
              <p className="text-xs text-red-600 mt-1">
                到期时间: {formatDate(currentUser.blacklistExpiry)}
              </p>
            )}
            <p className="text-xs text-red-500 mt-2">
              黑名单期间无法预约和借用工具，请联系物业管理员处理
            </p>
          </div>
        </div>
      )}

      <Card>
        <Card.Content className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={currentUser.role === 'admin' ? 'primary' : 'secondary'}>
                    {currentUser.role === 'admin' ? '管理员' : '居民'}
                  </Badge>
                  {currentUser.isBlacklisted ? (
                    <Badge variant="danger">黑名单</Badge>
                  ) : (
                    <Badge variant="success">正常</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">房间号</p>
                  <p className="text-sm font-medium text-gray-900">{currentUser.roomNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">联系电话</p>
                  <p className="text-sm font-medium text-gray-900">{currentUser.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Hash className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">用户编号</p>
                  <p className="text-sm font-medium text-gray-900">{currentUser.id}</p>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalBorrowed}</p>
                <p className="text-xs text-gray-500">累计借用</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">¥{totalDeposit}</p>
                <p className="text-xs text-gray-500">押金总额</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">¥{totalCompensation}</p>
                <p className="text-xs text-gray-500">累计赔付</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                pendingCompensation > 0 ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <XCircle className={`w-5 h-5 ${pendingCompensation > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${pendingCompensation > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  ¥{pendingCompensation}
                </p>
                <p className="text-xs text-gray-500">待赔付</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {isAdminView && (
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Ban className="w-4 h-4" />
                黑名单管理
              </h3>
              {currentUser.isBlacklisted ? (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => removeBlacklist(currentUser.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  解除黑名单
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowBlacklistModal(true)}
                >
                  <Ban className="w-4 h-4 mr-1" />
                  加入黑名单
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              黑名单用户将无法提交预约申请和借用工具，适用于逾期不还、恶意损坏等情况
            </p>
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Content className="p-0">
          <Tabs items={profileTabs} defaultKey="history" />
        </Card.Content>
      </Card>

      <Modal
        isOpen={showBlacklistModal}
        onClose={() => setShowBlacklistModal(false)}
        title="加入黑名单"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">
              <span className="font-medium">警告：</span>
              将用户加入黑名单后，该用户将无法预约和借用任何工具。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              限制原因
            </label>
            <textarea
              value={blacklistReason}
              onChange={(e) => setBlacklistReason(e.target.value)}
              placeholder="请输入加入黑名单的原因..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              限制天数
            </label>
            <Input
              type="number"
              value={blacklistDays}
              onChange={(e) => setBlacklistDays(Number(e.target.value))}
              min={1}
              max={365}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowBlacklistModal(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleAddBlacklist}
              disabled={!blacklistReason.trim()}
            >
              确认加入黑名单
            </Button>
          </div>
        </div>
      </Modal>
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
