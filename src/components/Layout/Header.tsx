import { Home, Wrench, Calendar, ClipboardList, User, Bell, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAppStore } from '@/store';
import { getStatusColor, getStatusLabel } from '@/utils/date';

const navItems = [
  { path: '/home', label: '首页', icon: Home },
  { path: '/tools', label: '工具目录', icon: Wrench },
  { path: '/reserve', label: '预约借用', icon: Calendar },
  { path: '/records', label: '借还记录', icon: ClipboardList },
  { path: '/profile', label: '个人中心', icon: User },
];

export default function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, getExpiringSoonCount, toggleAdminView, isAdminView } = useAppStore();
  const expiringCount = getExpiringSoonCount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">社区工具共享</h1>
              <p className="text-xs text-gray-500">便民服务平台</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.path === '/records' && expiringCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {expiringCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {currentUser.role === 'admin' && (
              <button
                onClick={toggleAdminView}
                className={`hidden md:flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isAdminView
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isAdminView ? '管理模式' : '居民模式'}
              </button>
            )}
            <div className="relative hidden md:block">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                {expiringCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {expiringCount}
                  </span>
                )}
              </button>
            </div>
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{currentUser.name[0]}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.roomNumber}</p>
              </div>
              {currentUser.isBlacklisted && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor('rejected')}`}>
                  {getStatusLabel('rejected')}
                </span>
              )}
            </div>
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-base font-medium text-blue-600">{currentUser.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.roomNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
