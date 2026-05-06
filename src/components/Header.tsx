import React from 'react';
import { Bell, Search, Menu, User, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

const roleLabels: Record<string, string> = {
  government_user: 'Government User',
  government_approver: 'Government Approver',
  rental_admin: 'Rental Admin',
  inspector: 'Inspector',
  fleet_manager: 'Fleet Manager'
};

const roleBadgeColors: Record<string, string> = {
  government_user: 'bg-blue-100 text-blue-700',
  government_approver: 'bg-green-100 text-green-700',
  rental_admin: 'bg-red-100 text-red-700',
  inspector: 'bg-yellow-100 text-yellow-700',
  fleet_manager: 'bg-purple-100 text-purple-700'
};

const Header: React.FC<HeaderProps> = ({ title, onMenuClick, isSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const notifications = [
    { id: 1, message: 'New rental request from Ministry of Finance', time: '5 min ago', unread: true },
    { id: 2, message: 'Vehicle NNZ 123 DBN maintenance completed', time: '1 hour ago', unread: true },
    { id: 3, message: 'Invoice INV-2025-0002 payment received', time: '2 hours ago', unread: false },
    { id: 4, message: 'Rental RNT-2025-0003 due for return tomorrow', time: '3 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-slate-200 z-30 transition-all duration-300 ${
        isSidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vehicles, rentals..."
              className="bg-transparent border-none outline-none ml-2 text-sm w-64"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 hover:bg-slate-100 rounded-lg"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer ${
                        notification.unread ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm text-slate-700">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-slate-100">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-700">{user?.fullName || 'User'}</p>
                {user && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadgeColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  {user?.departmentName && (
                    <p className="text-xs text-slate-500 mt-1">{user.departmentName}</p>
                  )}
                </div>

                {/* Role Badge */}
                {user && (
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span className={`text-xs px-2 py-1 rounded-full ${roleBadgeColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </div>
                  </div>
                )}

                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <hr className="my-2" />
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
