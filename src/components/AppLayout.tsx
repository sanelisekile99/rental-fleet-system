import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ViewType } from '@/types';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import FleetManagement from './FleetManagement';
import RentalRequests from './RentalRequests';
import Quotations from './Quotations';
import ActiveRentals from './ActiveRentals';
import Inspections from './Inspections';
import Invoices from './Invoices';
import Reports from './Reports';
import AuditTrail from './AuditTrail';
import Settings from './Settings';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProtectedRoute from './ProtectedRoute';
import { Loader2 } from 'lucide-react';

const viewTitles: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  fleet: 'Fleet Management',
  requests: 'Rental Requests',
  quotations: 'Quotations',
  rentals: 'Active Rentals',
  inspections: 'Inspections',
  invoices: 'Invoices & Payments',
  reports: 'Reports & Analytics',
  audit: 'Audit Trail',
  settings: 'Settings',
};

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar, setNavigateFunction } = useAppContext();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState<ViewType>(
    user?.role === 'government_user' ? 'fleet' : 'dashboard'
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Set default view based on user role
  React.useEffect(() => {
    if (user?.role === 'government_user') {
      setCurrentView('fleet');
    } else if (user?.role) {
      setCurrentView('dashboard');
    }
  }, [user?.role]);

  // Register navigation function with app context
  React.useEffect(() => {
    setNavigateFunction(setCurrentView);
  }, [setNavigateFunction]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ProtectedRoute permission="view_dashboard">
            <Dashboard />
          </ProtectedRoute>
        );
      case 'fleet':
        return (
          <ProtectedRoute permission="view_fleet">
            <FleetManagement />
          </ProtectedRoute>
        );
      case 'requests':
        return (
          <ProtectedRoute permission="view_requests">
            <RentalRequests />
          </ProtectedRoute>
        );
      case 'quotations':
        return (
          <ProtectedRoute permission="view_quotations">
            <Quotations />
          </ProtectedRoute>
        );
      case 'rentals':
        return (
          <ProtectedRoute permission="view_rentals">
            <ActiveRentals />
          </ProtectedRoute>
        );
      case 'inspections':
        return (
          <ProtectedRoute permission="view_inspections">
            <Inspections />
          </ProtectedRoute>
        );
      case 'invoices':
        return (
          <ProtectedRoute permission="view_invoices">
            <Invoices />
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute permission="view_reports">
            <Reports />
          </ProtectedRoute>
        );
      case 'audit':
        return (
          <ProtectedRoute permission="view_audit">
            <AuditTrail />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute permission="manage_settings">
            <Settings />
          </ProtectedRoute>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Header */}
      <Header
        title={viewTitles[currentView]}
        onMenuClick={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="p-6">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default AppLayout;
