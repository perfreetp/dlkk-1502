import { useNavigate } from 'react-router-dom';
import { Wrench, Calendar, ClipboardList, User, Package, TrendingUp, Bell, ChevronRight, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDateTime, getStatusLabel, getStatusColor } from '@/utils/date';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import ToolDetailDrawer from '@/components/features/ToolDetailDrawer';

const quickActions = [
  { icon: Wrench, label: '浏览工具', path: '/tools', color: 'bg-blue-500', desc: '按分类查找' },
  { icon: Calendar, label: '预约借用', path: '/reservation', color: 'bg-orange-500', desc: '选日期时段' },
  { icon: ClipboardList, label: '借还记录', path: '/records', color: 'bg-emerald-500', desc: '扫码借还' },
  { icon: User, label: '个人中心', path: '/profile', color: 'bg-purple-500', desc: '我的记录' },
];

export default function Home() {
  const navigate = useNavigate();
  const {
    getBorrowedCount,
    getPendingReturnCount,
    getExpiringSoonCount,
    getHotTools,
    announcements,
    currentUser,
    getMyReservations,
  } = useAppStore();

  const borrowedCount = getBorrowedCount();
  const pendingReturnCount = getPendingReturnCount();
  const expiringSoonCount = getExpiringSoonCount();
  const hotTools = getHotTools();
  const myReservations = getMyReservations();
  const pendingReservations = myReservations.filter((r) => r.status === 'pending').length;

  const importantAnnouncements = announcements.filter((a) => a.priority === 'important').slice(0, 3);
  const normalAnnouncements = announcements.filter((a) => a.priority === 'normal').slice(0, 3);

  return (
    <div className="space-y-6">
      {currentUser.isBlacklisted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">您当前处于黑名单中</p>
            <p className="text-xs text-red-600 mt-1">
              原因: {currentUser.blacklistReason}
              {currentUser.blacklistExpiry && ` · 解除时间: ${formatDateTime(currentUser.blacklistExpiry)}`}
            </p>
          </div>
        </div>
      )}

      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-2">您好，{currentUser.name} 👋</h1>
          <p className="text-blue-100 text-sm mb-6">欢迎使用社区工具共享平台</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">当前在借</span>
              </div>
              <p className="text-3xl font-bold">{borrowedCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">待归还</span>
              </div>
              <p className="text-3xl font-bold">{pendingReturnCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span className="text-xs text-blue-200">即将到期</span>
              </div>
              <p className="text-3xl font-bold">{expiringSoonCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">待审核</span>
              </div>
              <p className="text-3xl font-bold">{pendingReservations}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.path}
              hover
              onClick={() => navigate(action.path)}
              className="p-5"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{action.label}</h3>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            热门工具
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tools')}
            className="text-sm"
          >
            查看全部 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {hotTools.map((tool, index) => (
            <Card
              key={tool.id}
              hover
              onClick={() => navigate(`/tools?highlight=${tool.id}`)}
              className="relative overflow-hidden group"
            >
              <div className="absolute top-2 left-2 z-10">
                <span className={`w-6 h-6 ${index < 3 ? 'bg-orange-500' : 'bg-gray-400'} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                  {index + 1}
                </span>
              </div>
              <img
                src={tool.image}
                alt={tool.name}
                className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{tool.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">已借 {tool.borrowCount} 次</span>
                  {tool.availableStock > 0 ? (
                    <Badge variant="success">可借</Badge>
                  ) : (
                    <Badge variant="danger">无货</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              重要通知
            </h2>
          </div>
          <div className="space-y-3">
            {importantAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{announcement.title}</h3>
                      <Badge variant="danger">重要</Badge>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDateTime(announcement.createdAt)}</p>
                  </div>
                </div>
              </Card>
            ))}
            {importantAnnouncements.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无重要通知</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              最近预约
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/records')}
              className="text-sm"
            >
              查看全部 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {myReservations.slice(0, 3).map((reservation) => (
              <Card key={reservation.id} className="p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={reservation.toolImage}
                    alt={reservation.toolName}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{reservation.toolName}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {reservation.startDate} ~ {reservation.endDate}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">押金 ¥{reservation.totalDeposit}</span>
                      <span className="text-xs text-orange-600">租金 ¥{reservation.totalRent}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {myReservations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无预约记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">常见问题</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {normalAnnouncements.filter((a) => a.type === 'faq').slice(0, 4).map((faq) => (
            <Card key={faq.id} className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{faq.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-3">{faq.content}</p>
            </Card>
          ))}
        </div>
      </div>

      <ToolDetailDrawer />
    </div>
  );
}
