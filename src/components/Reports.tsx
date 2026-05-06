import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Download,
  FileText,
  Car,
  Building2,
  DollarSign,
  Clock,
  Filter
} from 'lucide-react';

interface ReportData {
  fleetUtilization: { month: string; utilization: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  departmentUsage: { name: string; rentals: number; spending: number }[];
  vehicleTypeDistribution: { type: string; count: number }[];
  topVehicles: { registration: string; make: string; model: string; rentals: number; revenue: number }[];
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState('year');
  const [reportData, setReportData] = useState<ReportData>({
    fleetUtilization: [],
    revenueByMonth: [],
    departmentUsage: [],
    vehicleTypeDistribution: [],
    topVehicles: [],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      // Fetch vehicles for distribution
      const { data: vehicles } = await supabase.from('vehicles').select('vehicle_type, daily_rate');
      
      // Fetch departments
      const { data: departments } = await supabase.from('government_departments').select('*');
      
      // Fetch rentals
      const { data: rentals } = await supabase
        .from('rentals')
        .select('*, vehicle:vehicles(*), department:government_departments(*)');
      
      // Fetch invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, department:government_departments(*)');

      // Calculate vehicle type distribution
      const typeCount: Record<string, number> = {};
      vehicles?.forEach((v) => {
        typeCount[v.vehicle_type] = (typeCount[v.vehicle_type] || 0) + 1;
      });
      const vehicleTypeDistribution = Object.entries(typeCount).map(([type, count]) => ({
        type,
        count,
      }));

      // Calculate department usage
      const deptUsage: Record<string, { rentals: number; spending: number }> = {};
      rentals?.forEach((r) => {
        const deptName = r.department?.name || 'Unknown';
        if (!deptUsage[deptName]) {
          deptUsage[deptName] = { rentals: 0, spending: 0 };
        }
        deptUsage[deptName].rentals += 1;
      });
      invoices?.forEach((inv) => {
        const deptName = inv.department?.name || 'Unknown';
        if (!deptUsage[deptName]) {
          deptUsage[deptName] = { rentals: 0, spending: 0 };
        }
        deptUsage[deptName].spending += Number(inv.total_amount);
      });
      const departmentUsage = Object.entries(deptUsage).map(([name, data]) => ({
        name,
        ...data,
      }));

      // Mock monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fleetUtilization = months.map((month, i) => ({
        month,
        utilization: 45 + Math.floor(Math.random() * 35),
      }));
      const revenueByMonth = months.map((month, i) => ({
        month,
        revenue: 15000 + Math.floor(Math.random() * 25000),
      }));

      // Top vehicles
      const vehicleRentals: Record<string, { registration: string; make: string; model: string; rentals: number; revenue: number }> = {};
      rentals?.forEach((r) => {
        const key = r.vehicle_id;
        if (!vehicleRentals[key]) {
          vehicleRentals[key] = {
            registration: r.vehicle?.registration_number || '',
            make: r.vehicle?.make || '',
            model: r.vehicle?.model || '',
            rentals: 0,
            revenue: 0,
          };
        }
        vehicleRentals[key].rentals += 1;
        vehicleRentals[key].revenue += Number(r.vehicle?.daily_rate || 0) * 5; // Estimate
      });
      const topVehicles = Object.values(vehicleRentals)
        .sort((a, b) => b.rentals - a.rentals)
        .slice(0, 5);

      setReportData({
        fleetUtilization,
        revenueByMonth,
        departmentUsage,
        vehicleTypeDistribution,
        topVehicles,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'fleet', label: 'Fleet Analysis', icon: Car },
    { id: 'departments', label: 'Department Usage', icon: Building2 },
    { id: 'revenue', label: 'Revenue Report', icon: DollarSign },
  ];

  const maxRevenue = Math.max(...reportData.revenueByMonth.map((r) => r.revenue));
  const maxUtilization = Math.max(...reportData.fleetUtilization.map((f) => f.utilization));
  const totalRevenue = reportData.revenueByMonth.reduce((sum, r) => sum + r.revenue, 0);
  const avgUtilization = Math.round(
    reportData.fleetUtilization.reduce((sum, f) => sum + f.utilization, 0) / reportData.fleetUtilization.length
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeReport === report.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{report.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-800">R{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">+12% from last period</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Avg Fleet Utilization</p>
              <p className="text-2xl font-bold text-slate-800">{avgUtilization}%</p>
              <p className="text-xs text-green-600 mt-1">+5% from last period</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Rentals</p>
              <p className="text-2xl font-bold text-slate-800">
                {reportData.departmentUsage.reduce((sum, d) => sum + d.rentals, 0)}
              </p>
              <p className="text-xs text-green-600 mt-1">+8 from last period</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Departments</p>
              <p className="text-2xl font-bold text-slate-800">{reportData.departmentUsage.length}</p>
              <p className="text-xs text-slate-500 mt-1">Government clients</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Revenue</h3>
          <div className="h-64 flex items-end gap-2">
            {reportData.revenueByMonth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer"
                  style={{ height: `${(data.revenue / maxRevenue) * 200}px` }}
                  title={`R${data.revenue.toLocaleString()}`}
                />
                <span className="text-xs text-slate-500 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Utilization Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Fleet Utilization</h3>
          <div className="h-64 flex items-end gap-2">
            {reportData.fleetUtilization.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t-sm transition-colors cursor-pointer ${
                    data.utilization >= 70
                      ? 'bg-green-500 hover:bg-green-600'
                      : data.utilization >= 50
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  style={{ height: `${(data.utilization / 100) * 200}px` }}
                  title={`${data.utilization}%`}
                />
                <span className="text-xs text-slate-500 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Usage & Vehicle Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Usage */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Department Usage</h3>
          <div className="space-y-4">
            {reportData.departmentUsage.slice(0, 6).map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{dept.name}</p>
                    <p className="text-xs text-slate-500">{dept.rentals} rentals</p>
                  </div>
                </div>
                <span className="font-semibold text-slate-800">R{dept.spending.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Type Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Vehicle Type Distribution</h3>
          <div className="space-y-4">
            {reportData.vehicleTypeDistribution.map((type, index) => {
              const total = reportData.vehicleTypeDistribution.reduce((sum, t) => sum + t.count, 0);
              const percentage = Math.round((type.count / total) * 100);
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{type.type}</span>
                    <span className="font-medium text-slate-800">{type.count} ({percentage}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[index % colors.length]} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performing Vehicles */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Performing Vehicles</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rank</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Vehicle</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Registration</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Total Rentals</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.topVehicles.map((vehicle, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{vehicle.make} {vehicle.model}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.registration}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {vehicle.rentals}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-600">R{vehicle.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Fleet Utilization Report', description: 'Detailed analysis of vehicle usage patterns', icon: Car },
            { title: 'Financial Summary', description: 'Revenue, expenses, and profitability metrics', icon: DollarSign },
            { title: 'Department Activity', description: 'Usage statistics by government department', icon: Building2 },
            { title: 'Maintenance Report', description: 'Vehicle service history and upcoming maintenance', icon: Clock },
            { title: 'Compliance Report', description: 'Insurance, registration, and regulatory compliance', icon: FileText },
            { title: 'Custom Report', description: 'Build your own report with custom parameters', icon: Filter },
          ].map((report, index) => {
            const Icon = report.icon;
            return (
              <button
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{report.title}</p>
                  <p className="text-sm text-slate-500">{report.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Reports;
