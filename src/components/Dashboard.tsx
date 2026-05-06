import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/useAuth';
import { useAppContext } from '@/contexts/useAppContext';
import { toast } from '@/components/ui/use-toast';
import {
  Car,
  Key,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2
} from 'lucide-react';

interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  activeRentals: number;
  pendingRequests: number;
  overdueRentals: number;
  monthlyRevenue: number;
  pendingPayments: number;
  fleetUtilization: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
}

interface UpcomingReturn {
  rental_number: string;
  vehicle: string;
  department: string;
  expected_end_date: string;
  days_remaining: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { navigateToView } = useAppContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    activeRentals: 0,
    pendingRequests: 0,
    overdueRentals: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    fleetUtilization: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<UpcomingReturn[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch vehicle stats
      const { data: vehicles } = await supabase.from('vehicles').select('status');
      const totalVehicles = vehicles?.length || 0;
      const availableVehicles = vehicles?.filter(v => v.status === 'available').length || 0;
      const rentedVehicles = vehicles?.filter(v => v.status === 'rented').length || 0;
      const maintenanceVehicles = vehicles?.filter(v => v.status === 'maintenance').length || 0;

      // Fetch active rentals
      const { data: rentals } = await supabase
        .from('rentals')
        .select('*, vehicle:vehicles(registration_number, make, model), department:government_departments(name)')
        .eq('status', 'active');
      const activeRentals = rentals?.length || 0;

      // Calculate upcoming returns
      const today = new Date();
      const upcoming = rentals?.map(r => {
        const endDate = new Date(r.expected_end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          rental_number: r.rental_number,
          vehicle: `${r.vehicle?.make} ${r.vehicle?.model} (${r.vehicle?.registration_number})`,
          department: r.department?.name || 'Unknown',
          expected_end_date: r.expected_end_date,
          days_remaining: daysRemaining,
        };
      }).filter(r => r.days_remaining <= 7 && r.days_remaining >= 0)
        .sort((a, b) => a.days_remaining - b.days_remaining) || [];

      setUpcomingReturns(upcoming);

      // Fetch pending requests
      const { data: requests } = await supabase
        .from('rental_requests')
        .select('id')
        .eq('status', 'pending');
      const pendingRequests = requests?.length || 0;

      // Fetch invoice data
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, status');
      const monthlyRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      const pendingPayments = invoices?.filter(inv => inv.status === 'pending' || inv.status === 'partial')
        .reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;

      // Calculate fleet utilization
      const fleetUtilization = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

      // Fetch recent audit logs for activity
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = auditLogs?.map(log => ({
        id: log.id,
        type: log.entity_type,
        message: `${log.action.replace('_', ' ')} on ${log.entity_type}`,
        time: new Date(log.created_at).toLocaleString(),
      })) || [];

      setRecentActivities(activities);

      setStats({
        totalVehicles,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
        activeRentals,
        pendingRequests,
        overdueRentals: 0,
        monthlyRevenue,
        pendingPayments,
        fleetUtilization,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Define all available cards
  const allStatCards = [
    {
      title: 'Total Fleet',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'increase',
      showToRole: ['rental_admin', 'fleet_manager', 'inspector'],
    },
    {
      title: 'Available Vehicles',
      value: stats.availableVehicles,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: `${Math.round((stats.availableVehicles / stats.totalVehicles) * 100) || 0}%`,
      changeType: 'neutral',
      showToRole: ['rental_admin', 'fleet_manager', 'government_approver', 'inspector'],
    },
    {
      title: 'Active Rentals',
      value: stats.activeRentals,
      icon: Key,
      color: 'bg-purple-500',
      change: '+3',
      changeType: 'increase',
      showToRole: ['rental_admin', 'fleet_manager', 'government_approver'],
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: FileText,
      color: 'bg-orange-500',
      change: 'Needs attention',
      changeType: 'warning',
      showToRole: ['rental_admin', 'fleet_manager', 'government_approver'],
    },
    {
      title: 'Monthly Revenue',
      value: `R${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+12%',
      changeType: 'increase',
      showToRole: ['rental_admin', 'fleet_manager'], // Exclude government roles
    },
    {
      title: 'Fleet Utilization',
      value: `${stats.fleetUtilization}%`,
      icon: TrendingUp,
      color: 'bg-cyan-500',
      change: '+5%',
      changeType: 'increase',
      showToRole: ['rental_admin', 'fleet_manager', 'government_approver'],
    },
    {
      title: 'In Maintenance',
      value: stats.maintenanceVehicles,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      change: '2 scheduled',
      changeType: 'neutral',
      showToRole: ['rental_admin', 'fleet_manager', 'inspector'],
    },
    {
      title: 'Pending Payments',
      value: `R${stats.pendingPayments.toLocaleString()}`,
      icon: Clock,
      color: 'bg-red-500',
      change: 'Follow up',
      changeType: 'warning',
      showToRole: ['rental_admin', 'fleet_manager'], // Exclude government roles
    },
  ];

  // Filter cards based on user role - hide financial information for government users
  const statCards = allStatCards.filter(card => 
    !card.showToRole || card.showToRole.includes(user?.role || '')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                  <div className="flex items-center mt-2">
                    {card.changeType === 'increase' && (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    )}
                    {card.changeType === 'decrease' && (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-medium ml-1 ${
                        card.changeType === 'increase'
                          ? 'text-green-600'
                          : card.changeType === 'warning'
                          ? 'text-orange-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Government Approver Specific Section */}
      {user?.role === 'government_approver' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Requests Requiring Your Attention
            </h3>
            <div className="space-y-3">
              <div 
                onClick={() => {
                  navigateToView('requests');
                  toast({
                    title: "Opening Request Details",
                    description: "Navigating to REQ-2024-003 for review...",
                  });
                }}
                className="p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-orange-800">REQ-2024-003</p>
                    <p className="text-sm text-orange-600">SUV for site inspection - Submitted 2 days ago</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    Pending Review
                  </span>
                </div>
              </div>
              <div 
                onClick={() => {
                  navigateToView('requests');
                  toast({
                    title: "Opening Request Details", 
                    description: "Navigating to REQ-2024-004 for review...",
                  });
                }}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-800">REQ-2024-004</p>
                    <p className="text-sm text-blue-600">Sedan for official meeting - Submitted 1 day ago</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Pending Review
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Department Activity Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Approved This Week</p>
                  <p className="text-sm text-green-600">3 requests processed</p>
                </div>
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Active Rentals</p>
                  <p className="text-sm text-blue-600">Currently in use</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">{stats.activeRentals}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">Pending Approval</p>
                  <p className="text-sm text-yellow-600">Awaiting your review</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Tables Row - Hidden for Government Approvers */}
      {user?.role !== 'government_approver' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fleet Status Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Fleet Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Available</span>
                <span className="font-medium text-slate-800">{stats.availableVehicles}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(stats.availableVehicles / stats.totalVehicles) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Rented</span>
                <span className="font-medium text-slate-800">{stats.rentedVehicles}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(stats.rentedVehicles / stats.totalVehicles) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Maintenance</span>
                <span className="font-medium text-slate-800">{stats.maintenanceVehicles}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${(stats.maintenanceVehicles / stats.totalVehicles) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Reserved</span>
                <span className="font-medium text-slate-800">
                  {stats.totalVehicles - stats.availableVehicles - stats.rentedVehicles - stats.maintenanceVehicles}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${
                      ((stats.totalVehicles - stats.availableVehicles - stats.rentedVehicles - stats.maintenanceVehicles) /
                        stats.totalVehicles) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Fleet Size</span>
              <span className="text-lg font-bold text-slate-800">{stats.totalVehicles} vehicles</span>
            </div>
          </div>
        </div>

        {/* Upcoming Returns */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Upcoming Returns</h3>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {upcomingReturns.length > 0 ? (
              upcomingReturns.slice(0, 5).map((rental, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    rental.days_remaining <= 1
                      ? 'bg-red-50 border-red-200'
                      : rental.days_remaining <= 3
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{rental.vehicle}</p>
                      <p className="text-xs text-slate-500 mt-1">{rental.department}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        rental.days_remaining <= 1
                          ? 'bg-red-100 text-red-700'
                          : rental.days_remaining <= 3
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rental.days_remaining === 0
                        ? 'Today'
                        : rental.days_remaining === 1
                        ? 'Tomorrow'
                        : `${rental.days_remaining} days`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming returns this week</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm text-slate-700 capitalize">{activity.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Department Usage - Hidden for Government Approvers */}
      {user?.role !== 'government_approver' && (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Department Usage Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Ministry of Finance', rentals: 12, spending: 18500, color: 'bg-blue-500' },
            { name: 'Ministry of Health', rentals: 8, spending: 24200, color: 'bg-green-500' },
            { name: 'Ministry of Education', rentals: 15, spending: 12800, color: 'bg-purple-500' },
            { name: 'Office of the President', rentals: 6, spending: 35000, color: 'bg-orange-500' },
          ].map((dept, index) => (
            <div key={index} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <p className="font-medium text-slate-800 text-sm">{dept.name}</p>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>{dept.rentals} rentals</span>
                <span className="font-medium text-slate-700">${dept.spending.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* Government Approver Specific Content */}
      {user?.role === 'government_approver' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions for Approvers */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Quick Approval Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  navigateToView('requests');
                  toast({
                    title: "Navigating to Rental Requests",
                    description: "Redirecting to review pending requests...",
                  });
                }}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <div className="text-left">
                  <p className="font-medium text-blue-800">Review Pending Requests</p>
                  <p className="text-sm text-blue-600">{stats.pendingRequests} requests awaiting approval</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              </button>
              <button 
                onClick={() => {
                  navigateToView('rentals');
                  toast({
                    title: "Navigating to Active Rentals",
                    description: "Viewing currently active vehicle rentals...",
                  });
                }}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <div className="text-left">
                  <p className="font-medium text-green-800">View Active Rentals</p>
                  <p className="text-sm text-green-600">{stats.activeRentals} vehicles currently in use</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </button>
              <button 
                onClick={() => {
                  navigateToView('fleet');
                  toast({
                    title: "Navigating to Fleet Management",
                    description: "Viewing available vehicles for allocation...",
                  });
                }}
                className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <div className="text-left">
                  <p className="font-medium text-orange-800">View Available Vehicles</p>
                  <p className="text-sm text-orange-600">{stats.availableVehicles} vehicles ready for allocation</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-orange-600" />
              </button>
            </div>
          </div>

          {/* Department Summary for Approvers */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Your Department Overview
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Department of Transport</p>
                    <p className="text-sm text-slate-600">Main government department</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">This Month</p>
                    <p className="text-lg font-bold text-blue-600">15 requests</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">12</p>
                  <p className="text-xs text-green-600">Approved</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
                  <p className="text-xs text-yellow-600">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
