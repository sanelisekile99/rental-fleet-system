import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RentalRequest, Department } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Can } from '@/components/ProtectedRoute';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
  FileText,
  User,
  MapPin,
  ChevronRight,
  Lock
} from 'lucide-react';

const RentalRequests: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { selectedVehicleForRequest, setSelectedVehicleForRequest } = useAppContext();
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    department_id: '',
    vehicle_type_requested: 'Sedan',
    purpose: '',
    start_date: '',
    end_date: '',
    pickup_location: 'Main Depot, Durban',
    dropoff_location: '',
    driver_name: '',
    driver_license: '',
    special_requirements: '',
    priority: 'normal',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle pre-selected vehicle from Fleet Management
  useEffect(() => {
    if (selectedVehicleForRequest) {
      setNewRequest(prev => ({
        ...prev,
        vehicle_type_requested: selectedVehicleForRequest.vehicle_type || 'Sedan'
      }));
      setShowNewRequestModal(true);
      // Clear the selected vehicle after using it
      setSelectedVehicleForRequest(null);
    }
  }, [selectedVehicleForRequest, setSelectedVehicleForRequest]);

  const fetchData = async () => {
    try {
      let requestsQuery = supabase
        .from('rental_requests')
        .select('*, department:government_departments(*)')
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (user?.role === 'government_user') {
        // Government users can only see their own requests
        requestsQuery = requestsQuery.eq('requester_id', user.id);
      } else if (user?.role === 'government_approver' && user.departmentId) {
        // Government approvers can see all requests from their department
        requestsQuery = requestsQuery.eq('department_id', user.departmentId);
      }

      const [requestsRes, deptsRes] = await Promise.all([
        requestsQuery,
        supabase.from('government_departments').select('*').order('name'),
      ]);

      if (requestsRes.data) setRequests(requestsRes.data);
      if (deptsRes.data) setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Provide demo data when database is not available
      const demoDepartment = {
        id: 'demo-dept-1',
        name: 'Department of Transport',
        code: 'DOT',
        contact_person: 'Thabo Mthembu',
        contact_email: 'thabo.mthembu@transport.gov.za',
        contact_phone: '+27 11 555 0000',
        address: 'Pretoria, Gauteng, South Africa',
        budget_allocation: 15000000,
        created_at: '2024-01-01'
      };
      
      const demoRequests = [
        {
          id: 'demo-req-1',
          request_number: 'REQ-2024-001',
          department_id: 'demo-dept-1',
          requester_id: user?.role === 'government_user' ? user.id : 'demo-user-thabo',
          vehicle_type_requested: 'Sedan',
          purpose: 'Official meeting at National Treasury',
          start_date: '2024-12-15',
          end_date: '2024-12-16',
          pickup_location: 'Department of Transport HQ, Pretoria',
          dropoff_location: 'National Treasury Building, Pretoria',
          driver_name: 'Sipho Nkomo',
          driver_license: 'DL123456',
          special_requirements: 'Air conditioning required',
          status: 'pending' as const,
          priority: 'normal' as const,
          created_at: '2024-12-10T10:00:00Z',
          updated_at: '2024-12-10T10:00:00Z',
          department: demoDepartment
        },
        {
          id: 'demo-req-2',
          request_number: 'REQ-2024-002',
          department_id: 'demo-dept-1',
          requester_id: 'demo-user-nomsa',
          vehicle_type_requested: 'SUV',
          purpose: 'Site inspection in Durban Port',
          start_date: '2024-12-20',
          end_date: '2024-12-22',
          pickup_location: 'Department of Transport HQ, Pretoria',
          dropoff_location: 'Durban Port Authority',
          driver_name: 'Nomsa Mbeki',
          driver_license: 'DL789012',
          special_requirements: '',
          status: 'approved' as const,
          priority: 'high' as const,
          created_at: '2024-12-09T14:00:00Z',
          updated_at: '2024-12-11T09:00:00Z',
          department: demoDepartment
        },
        {
          id: 'demo-req-3',
          request_number: 'REQ-2024-003',
          department_id: 'demo-dept-1',
          requester_id: 'demo-user-peter',
          vehicle_type_requested: 'SUV',
          purpose: 'Site inspection at mining facility',
          start_date: '2024-12-18',
          end_date: '2024-12-19',
          pickup_location: 'Department of Transport HQ, Pretoria',
          dropoff_location: 'Johannesburg Mining Site',
          driver_name: 'Peter Jacobs',
          driver_license: 'DL345678',
          special_requirements: '4WD required for rough terrain',
          status: 'pending' as const,
          priority: 'high' as const,
          created_at: '2024-12-11T08:00:00Z',
          updated_at: '2024-12-11T08:00:00Z',
          department: demoDepartment
        },
        {
          id: 'demo-req-4',
          request_number: 'REQ-2024-004',
          department_id: 'demo-dept-1',
          requester_id: 'demo-user-sarah',
          vehicle_type_requested: 'Sedan',
          purpose: 'Ministerial meeting in Cape Town',
          start_date: '2024-12-22',
          end_date: '2024-12-24',
          pickup_location: 'Department of Transport HQ, Pretoria',
          dropoff_location: 'Parliament Building, Cape Town',
          driver_name: 'Sarah Williams',
          driver_license: 'DL901234',
          special_requirements: 'Executive vehicle preferred',
          status: 'pending' as const,
          priority: 'urgent' as const,
          created_at: '2024-12-12T14:30:00Z',
          updated_at: '2024-12-12T14:30:00Z',
          department: demoDepartment
        },
        {
          id: 'demo-req-5',
          request_number: 'REQ-2024-005',
          department_id: 'demo-dept-1',
          requester_id: 'demo-user-john',
          vehicle_type_requested: 'Van',
          purpose: 'Equipment transport for conference',
          start_date: '2024-12-16',
          end_date: '2024-12-17',
          pickup_location: 'Department of Transport HQ, Pretoria',
          dropoff_location: 'Sandton Convention Centre',
          driver_name: 'John Mthembu',
          driver_license: 'DL567890',
          special_requirements: 'Large cargo space needed',
          status: 'pending' as const,
          priority: 'normal' as const,
          created_at: '2024-12-11T16:45:00Z',
          updated_at: '2024-12-11T16:45:00Z',
          department: demoDepartment
        }
      ];
      
      // Filter demo requests based on user role
      let filteredDemoRequests = demoRequests;
      console.log('User role:', user?.role, 'Department ID:', user?.departmentId);
      console.log('Total demo requests:', demoRequests.length);
      
      if (user?.role === 'government_user') {
        // Government users only see their own requests
        filteredDemoRequests = demoRequests.filter(req => req.requester_id === user.id);
        console.log('Government user filtered requests:', filteredDemoRequests.length);
      } else if (user?.role === 'government_approver') {
        // Government approvers see all department requests
        filteredDemoRequests = demoRequests.filter(req => req.department_id === user.departmentId);
        console.log('Government approver filtered requests:', filteredDemoRequests.length);
      }
      
      console.log('Final filtered requests:', filteredDemoRequests);
      
      setRequests(filteredDemoRequests);
      setDepartments([demoDepartment]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.driver_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ElementType }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      approved: { bg: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      rejected: { bg: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      cancelled: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: XCircle },
    };
    return styles[status] || styles.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-slate-100 text-slate-600',
      normal: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600',
    };
    return styles[priority] || styles.normal;
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    if (!hasPermission('approve_requests')) {
      alert('You do not have permission to approve/reject requests');
      return;
    }

    try {
      const { error } = await supabase
        .from('rental_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      fetchData();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', newRequest);
    
    // Basic validation
    if (!newRequest.purpose || !newRequest.start_date || !newRequest.end_date || !newRequest.driver_name || !newRequest.driver_license) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const requestNumber = `REQ-${new Date().getFullYear()}-${String(requests.length + 7).padStart(4, '0')}`;
      
      // For government users, auto-set their department
      const departmentId = (user?.role === 'government_user' || user?.role === 'government_approver') && user.departmentId 
        ? user.departmentId 
        : newRequest.department_id;

      try {
        // Try to insert into database first
        const { error } = await supabase.from('rental_requests').insert({
          ...newRequest,
          department_id: departmentId,
          requester_id: user?.id || null,
          request_number: requestNumber,
          status: 'pending',
        });

        if (error) throw error;
      } catch (dbError) {
        console.log('Database not available, using demo mode');
        // In demo mode, just simulate the request creation
        const newDemoRequest = {
          id: `demo-req-${Date.now()}`,
          request_number: requestNumber,
          department_id: departmentId || 'demo-dept-1',
          requester_id: user?.id || 'demo-gov-user',
          vehicle_type_requested: newRequest.vehicle_type_requested,
          purpose: newRequest.purpose,
          start_date: newRequest.start_date,
          end_date: newRequest.end_date,
          pickup_location: newRequest.pickup_location,
          dropoff_location: newRequest.dropoff_location,
          driver_name: newRequest.driver_name,
          driver_license: newRequest.driver_license,
          special_requirements: newRequest.special_requirements,
          priority: newRequest.priority as 'normal' | 'high' | 'low' | 'urgent',
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          department: {
            id: 'demo-dept-1',
            name: 'Department of Transport',
            code: 'DOT',
            contact_person: 'Thabo Mthembu',
            contact_email: 'thabo.mthembu@transport.gov.za',
            contact_phone: '+27 11 555 0000',
            address: 'Pretoria, Gauteng, South Africa',
            budget_allocation: 15000000,
            created_at: '2024-01-01'
          }
        };
        
        // Add to current requests list for immediate feedback
        setRequests(prev => [newDemoRequest, ...prev]);
      }

      setShowNewRequestModal(false);
      setNewRequest({
        department_id: '',
        vehicle_type_requested: 'Sedan',
        purpose: '',
        start_date: '',
        end_date: '',
        pickup_location: 'Main Depot, Durban',
        dropoff_location: '',
        driver_name: '',
        driver_license: '',
        special_requirements: '',
        priority: 'normal',
      });
      
      // Show success message
      toast({
        title: "Request Submitted Successfully!",
        description: `Rental request ${requestNumber} has been submitted for review.`,
      });
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    }
  };

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
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <Can permission="manage_requests">
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </Can>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', count: requests.length, icon: FileText, color: 'bg-slate-500' },
          { label: 'Pending', count: requests.filter((r) => r.status === 'pending').length, icon: Clock, color: 'bg-yellow-500' },
          { label: 'Approved', count: requests.filter((r) => r.status === 'approved').length, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Rejected', count: requests.filter((r) => r.status === 'rejected').length, icon: XCircle, color: 'bg-red-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.count}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Request #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Department</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Vehicle Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Period</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Priority</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((request) => {
                const statusStyle = getStatusBadge(request.status);
                const StatusIcon = statusStyle.icon;
                return (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{request.request_number}</p>
                      <p className="text-xs text-slate-500">{new Date(request.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{request.department?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{request.vehicle_type_requested}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{request.start_date}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{request.end_date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${statusStyle.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedRequest.request_number}</h2>
                  <p className="text-sm text-slate-500">Created {new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(selectedRequest.status).bg}`}>
                  {selectedRequest.status}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityBadge(selectedRequest.priority)}`}>
                  {selectedRequest.priority} priority
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">Department</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRequest.department?.name}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Car className="w-4 h-4" />
                    <span className="text-sm">Vehicle Type</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRequest.vehicle_type_requested}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Rental Period</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRequest.start_date} - {selectedRequest.end_date}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Driver</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRequest.driver_name}</p>
                  <p className="text-sm text-slate-500">{selectedRequest.driver_license}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Purpose</h4>
                <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{selectedRequest.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Pickup Location</h4>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedRequest.pickup_location}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Dropoff Location</h4>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedRequest.dropoff_location}
                  </div>
                </div>
              </div>

              {selectedRequest.special_requirements && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Special Requirements</h4>
                  <p className="text-slate-600 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    {selectedRequest.special_requirements}
                  </p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <Can 
                  permission="approve_requests"
                  fallback={
                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 rounded-lg p-4">
                      <Lock className="w-5 h-5" />
                      <span className="text-sm">You don't have permission to approve or reject requests</span>
                    </div>
                  }
                >
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Request
                    </button>
                  </div>
                </Can>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">New Rental Request</h2>
                <button onClick={() => setShowNewRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Only show department selector for rental admin and others */}
                {user?.role !== 'government_user' && user?.role !== 'government_approver' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <select
                      value={newRequest.department_id}
                      onChange={(e) => setNewRequest({ ...newRequest, department_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700">
                      {user.departmentName || 'Your Department'}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={newRequest.vehicle_type_requested}
                    onChange={(e) => setNewRequest({ ...newRequest, vehicle_type_requested: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Van</option>
                    <option>Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={newRequest.driver_name}
                    onChange={(e) => setNewRequest({ ...newRequest, driver_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver License</label>
                  <input
                    type="text"
                    value={newRequest.driver_license}
                    onChange={(e) => setNewRequest({ ...newRequest, driver_license: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    value={newRequest.pickup_location}
                    onChange={(e) => setNewRequest({ ...newRequest, pickup_location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dropoff Location</label>
                  <input
                    type="text"
                    value={newRequest.dropoff_location}
                    onChange={(e) => setNewRequest({ ...newRequest, dropoff_location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                <textarea
                  value={newRequest.purpose}
                  onChange={(e) => setNewRequest({ ...newRequest, purpose: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Special Requirements</label>
                <textarea
                  value={newRequest.special_requirements}
                  onChange={(e) => setNewRequest({ ...newRequest, special_requirements: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalRequests;
