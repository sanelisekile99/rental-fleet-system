import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Can, HasRole } from '@/components/ProtectedRoute';
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Palette,
  Save,
  Users,
  Key,
  FileText,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Lock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
  department?: { name: string };
}

const Settings: React.FC = () => {
  const { user, hasPermission, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'FleetGov South Africa',
    companyEmail: 'admin@fleetgov.ke',
    companyPhone: '+254 700 000 000',
    address: 'Union Buildings, Pretoria, South Africa',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    dateFormat: 'DD/MM/YYYY',
    defaultDailyRate: 150,
    insuranceRate: 50,
    fuelDepositRate: 100,
    lateFeePerDay: 50,
    taxRate: 16,
    emailNotifications: true,
    smsNotifications: false,
    rentalReminders: true,
    maintenanceAlerts: true,
    paymentReminders: true,
    approvalNotifications: true,
    requireApproval: true,
    approvalLevels: 3,
    autoGenerateInvoice: true,
    quotationValidDays: 7,
  });

  useEffect(() => {
    if (activeTab === 'users' && hasPermission('manage_users')) {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await supabase
        .from('system_users')
        .select('*, department:government_departments(name)')
        .order('full_name');
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('system_users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon, permission: 'manage_settings' as const },
    { id: 'company', label: 'Company', icon: Building2, permission: 'manage_settings' as const },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, permission: 'manage_settings' as const },
    { id: 'workflow', label: 'Workflow', icon: Clock, permission: 'manage_settings' as const },
    { id: 'users', label: 'User Management', icon: Users, permission: 'manage_users' as const },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Globe, permission: 'manage_settings' as const },
  ];

  const visibleTabs = tabs.filter(tab => !tab.permission || hasPermission(tab.permission));

  const handleSave = () => {
    // Save settings logic
    alert('Settings saved successfully!');
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-slate-500">Manage your system configuration</p>
        </div>
        <Can permission="manage_settings">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </Can>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!hasPermission('manage_settings')}
                    >
                      <option value="ZAR">ZAR (R)</option>
                      <option value="USD">USD ($)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!hasPermission('manage_settings')}
                    >
                      <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                      <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date Format</label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!hasPermission('manage_settings')}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Company Settings */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!hasPermission('manage_settings')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!hasPermission('manage_settings')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!hasPermission('manage_settings')}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!hasPermission('manage_settings')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', icon: Mail, title: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'rentalReminders', icon: Bell, title: 'Rental Reminders', desc: 'Get reminded about upcoming returns' },
                    { key: 'maintenanceAlerts', icon: SettingsIcon, title: 'Maintenance Alerts', desc: 'Get notified about vehicle maintenance' },
                    { key: 'paymentReminders', icon: DollarSign, title: 'Payment Reminders', desc: 'Get reminded about pending payments' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-500" />
                          <div>
                            <p className="font-medium text-slate-800">{item.title}</p>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof typeof settings] as boolean}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pricing Settings */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Pricing Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Daily Rate ($)</label>
                    <input
                      type="number"
                      value={settings.defaultDailyRate}
                      onChange={(e) => setSettings({ ...settings, defaultDailyRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Rate ($)</label>
                    <input
                      type="number"
                      value={settings.insuranceRate}
                      onChange={(e) => setSettings({ ...settings, insuranceRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Deposit ($)</label>
                    <input
                      type="number"
                      value={settings.fuelDepositRate}
                      onChange={(e) => setSettings({ ...settings, fuelDepositRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Late Fee Per Day ($)</label>
                    <input
                      type="number"
                      value={settings.lateFeePerDay}
                      onChange={(e) => setSettings({ ...settings, lateFeePerDay: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Settings */}
            {activeTab === 'workflow' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Workflow Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">Require Approval for Rentals</p>
                      <p className="text-sm text-slate-500">All rentals must go through approval workflow</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireApproval}
                        onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Approval Levels</label>
                      <select
                        value={settings.approvalLevels}
                        onChange={(e) => setSettings({ ...settings, approvalLevels: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>1 Level (Direct Approval)</option>
                        <option value={2}>2 Levels (Manager + Finance)</option>
                        <option value={3}>3 Levels (Manager + Finance + Director)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Quotation Valid Days</label>
                      <input
                        type="number"
                        value={settings.quotationValidDays}
                        onChange={(e) => setSettings({ ...settings, quotationValidDays: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Settings */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">User Management</h3>
                  <HasRole roles={['rental_admin']}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Add User
                    </button>
                  </HasRole>
                </div>
                
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((sysUser) => (
                      <div key={sysUser.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${sysUser.is_active ? 'bg-blue-500' : 'bg-slate-400'} rounded-full flex items-center justify-center`}>
                            <span className="text-white font-medium">
                              {sysUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{sysUser.full_name}</p>
                            <p className="text-sm text-slate-500">{sysUser.email}</p>
                            {sysUser.department && (
                              <p className="text-xs text-slate-400">{sysUser.department.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleBadgeColors[sysUser.role]}`}>
                            {roleLabels[sysUser.role]}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            sysUser.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {sysUser.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <HasRole roles={['rental_admin']}>
                            <button
                              onClick={() => handleToggleUserStatus(sysUser.id, sysUser.is_active)}
                              className={`p-2 rounded-lg ${
                                sysUser.is_active ? 'hover:bg-red-100 text-red-600' : 'hover:bg-green-100 text-green-600'
                              }`}
                              title={sysUser.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {sysUser.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                          </HasRole>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Security Settings</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Key className="w-5 h-5 text-slate-500" />
                      <p className="font-medium text-slate-800">Password Policy</p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>• Minimum 8 characters</p>
                      <p>• At least one uppercase letter</p>
                      <p>• At least one number</p>
                      <p>• At least one special character</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-slate-500" />
                      <p className="font-medium text-slate-800">Your Role Permissions</p>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${roleBadgeColors[user?.role || 'rental_admin']}`}>
                        {roleLabels[user?.role || 'rental_admin']}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Your role determines what features you can access in the system. Contact an administrator to request role changes.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-5 h-5 text-slate-500" />
                      <p className="font-medium text-slate-800">Audit Logging</p>
                    </div>
                    <p className="text-sm text-slate-600">All system activities are logged for compliance and security purposes.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">External Integrations</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Government Portal API', description: 'Connect to central government systems', status: 'Connected', icon: Globe },
                    { name: 'Email Service (SMTP)', description: 'Send automated emails and notifications', status: 'Connected', icon: Mail },
                    { name: 'GPS Tracking', description: 'Real-time vehicle location tracking', status: 'Not Connected', icon: Globe },
                    { name: 'Accounting Software', description: 'Sync invoices and payments', status: 'Not Connected', icon: Database },
                  ].map((integration, index) => {
                    const Icon = integration.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{integration.name}</p>
                            <p className="text-sm text-slate-500">{integration.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            integration.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {integration.status}
                          </span>
                          <button className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-100">
                            {integration.status === 'Connected' ? 'Configure' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
