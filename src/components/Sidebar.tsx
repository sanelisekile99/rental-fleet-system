import React from 'react';
import { ViewType } from '@/types';
import { useAuth } from '@/contexts/useAuth';
import { Permission } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Car,
  FileText,
  Calculator,
  Key,
  ClipboardCheck,
  Receipt,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  permission?: Permission;
}

const getMenuItems = (userRole?: string): MenuItem[] => [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
  { 
    id: 'fleet', 
    label: userRole === 'government_user' ? 'Available Vehicles' : 'Fleet Management', 
    icon: Car, 
    permission: 'view_fleet' 
  },
  { 
    id: 'requests', 
    label: userRole === 'government_user' ? 'My Requests' : 'Rental Requests', 
    icon: FileText, 
    permission: 'view_requests' 
  },
  { id: 'quotations', label: 'Quotations', icon: Calculator, permission: 'view_quotations' },
  { id: 'rentals', label: 'Active Rentals', icon: Key, permission: 'view_rentals' },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, permission: 'view_inspections' },
  { id: 'invoices', label: 'Invoices & Payments', icon: Receipt, permission: 'view_invoices' },
  { id: 'reports', label: 'Reports', icon: BarChart3, permission: 'view_reports' },
  { id: 'audit', label: 'Audit Trail', icon: History, permission: 'view_audit' },
  { id: 'settings', label: 'Settings', icon: Settings, permission: 'manage_settings' },
];

const roleLabels: Record<string, string> = {
  government_user: 'Government User',
  government_approver: 'Government Approver',
  rental_admin: 'Rental Admin',
  inspector: 'Inspector',
  fleet_manager: 'Fleet Manager'
};

const roleBadgeColors: Record<string, string> = {
  government_user: 'bg-blue-500',
  government_approver: 'bg-green-500',
  rental_admin: 'bg-red-500',
  inspector: 'bg-yellow-500',
  fleet_manager: 'bg-purple-500'
};

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user, logout, hasPermission } = useAuth();

  const menuItems = getMenuItems(user?.role);
  const visibleMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-40 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-400" />
            <span className="font-bold text-lg">FleetGov</span>
          </div>
        )}
        {isCollapsed && <Building2 className="w-8 h-8 text-blue-400 mx-auto" />}
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* User Role Badge */}
      {!isCollapsed && user && (
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleBadgeColors[user.role]} text-white`}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-2 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-700 p-4">
        {!isCollapsed && user ? (
          <div className="space-y-3">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${roleBadgeColors[user.role]} rounded-full flex items-center justify-center`}>
                  <span className="text-sm font-bold text-white">
                    {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        ) : isCollapsed && user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;
