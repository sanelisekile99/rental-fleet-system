import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Quotation, Vehicle, RentalRequest } from '@/types';
import {
  Search,
  Plus,
  Calculator,
  Calendar,
  Car,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  X,
  FileText,
  Send,
  Edit
} from 'lucide-react';

const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuotation, setNewQuotation] = useState({
    request_id: '',
    vehicle_id: '',
    daily_rate: 0,
    total_days: 1,
    insurance_amount: 50,
    fuel_deposit: 100,
    additional_charges: 0,
    discount_amount: 0,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotationsRes, vehiclesRes, requestsRes] = await Promise.all([
        supabase
          .from('quotations')
          .select('*, vehicle:vehicles(*), request:rental_requests(*, department:government_departments(*))')
          .order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*').eq('status', 'available'),
        supabase.from('rental_requests').select('*, department:government_departments(*)').eq('status', 'approved'),
      ]);

      if (quotationsRes.data) setQuotations(quotationsRes.data);
      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (requestsRes.data) setRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Provide demo data when database is not available
      const demoVehicles = [
        {
          id: 'demo-1',
          registration_number: 'CA 123-456',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          vehicle_type: 'Sedan',
          color: 'White',
          fuel_type: 'Petrol',
          transmission: 'Automatic',
          seating_capacity: 5,
          daily_rate: 850,
          current_mileage: 5000,
          status: 'available' as const,
          current_location: 'Main Depot, Durban',
          image_url: '/placeholder.svg',
          insurance_expiry: '2024-12-31',
          last_service_date: '2024-10-01',
          next_service_due: '2025-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-11-01'
        }
      ];
      
      const demoRequests = [
        {
          id: 'demo-req-1',
          request_number: 'REQ-2024-001',
          department_id: 'demo-dept-1',
          requester_id: 'demo-gov-user',
          vehicle_type_requested: 'Sedan',
          purpose: 'Official meeting',
          start_date: '2024-12-15',
          end_date: '2024-12-16',
          pickup_location: 'Department HQ, Pretoria',
          dropoff_location: 'Treasury Building, Pretoria',
          driver_name: 'Sipho Nkomo',
          driver_license: 'DL123456',
          special_requirements: '',
          status: 'approved' as const,
          priority: 'normal' as const,
          created_at: '2024-12-10T10:00:00Z',
          updated_at: '2024-12-10T10:00:00Z',
          department: {
            id: 'demo-dept-1',
            name: 'Department of Transport',
            code: 'DOT',
            contact_person: 'Thabo Mthembu',
            contact_email: 'thabo.mthembu@transport.gov.za',
            contact_phone: '+27 11 555 0000',
            address: 'Pretoria, Gauteng, South Africa',
            budget_allocation: 1000000,
            created_at: '2024-01-01'
          }
        }
      ];
      
      const demoQuotations = [
        {
          id: 'demo-quot-1',
          quotation_number: 'QT-2024-001',
          request_id: 'demo-req-1',
          vehicle_id: 'demo-1',
          daily_rate: 850,
          total_days: 2,
          base_amount: 1700,
          insurance_amount: 300,
          fuel_deposit: 500,
          additional_charges: 0,
          discount_amount: 0,
          total_amount: 2500,
          valid_until: '2024-12-20',
          status: 'pending' as const,
          notes: 'Standard rental quotation for government sedan.',
          created_by: 'rental_admin',
          created_at: '2024-12-11T09:00:00Z',
          vehicle: demoVehicles[0],
          request: demoRequests[0]
        }
      ];
      
      setQuotations(demoQuotations);
      setVehicles(demoVehicles);
      setRequests(demoRequests);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ElementType }> = {
      draft: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
      pending: { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      approved: { bg: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      rejected: { bg: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    };
    return styles[status] || styles.draft;
  };

  const calculateTotal = () => {
    const base = newQuotation.daily_rate * newQuotation.total_days;
    return base + newQuotation.insurance_amount + newQuotation.fuel_deposit + newQuotation.additional_charges - newQuotation.discount_amount;
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quotationNumber = `QT-${new Date().getFullYear()}-${String(quotations.length + 5).padStart(4, '0')}`;
      const baseAmount = newQuotation.daily_rate * newQuotation.total_days;
      const totalAmount = calculateTotal();

      const { error } = await supabase.from('quotations').insert({
        quotation_number: quotationNumber,
        request_id: newQuotation.request_id || null,
        vehicle_id: newQuotation.vehicle_id,
        daily_rate: newQuotation.daily_rate,
        total_days: newQuotation.total_days,
        base_amount: baseAmount,
        insurance_amount: newQuotation.insurance_amount,
        fuel_deposit: newQuotation.fuel_deposit,
        additional_charges: newQuotation.additional_charges,
        discount_amount: newQuotation.discount_amount,
        total_amount: totalAmount,
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        notes: newQuotation.notes,
      });

      if (error) throw error;
      setShowCreateModal(false);
      setNewQuotation({
        request_id: '',
        vehicle_id: '',
        daily_rate: 0,
        total_days: 1,
        insurance_amount: 50,
        fuel_deposit: 100,
        additional_charges: 0,
        discount_amount: 0,
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating quotation:', error);
    }
  };

  const handleStatusChange = async (quotationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ status: newStatus })
        .eq('id', quotationId);

      if (error) throw error;
      fetchData();
      setSelectedQuotation(null);
    } catch (error) {
      console.error('Error updating quotation status:', error);
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setNewQuotation({
        ...newQuotation,
        vehicle_id: vehicleId,
        daily_rate: vehicle.daily_rate,
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
              placeholder="Search quotations..."
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
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Quotation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Quotations', count: quotations.length, icon: Calculator, color: 'bg-slate-500' },
          { label: 'Pending Approval', count: quotations.filter((q) => q.status === 'pending').length, icon: Clock, color: 'bg-yellow-500' },
          { label: 'Approved', count: quotations.filter((q) => q.status === 'approved').length, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Total Value', count: `R${quotations.reduce((sum, q) => sum + Number(q.total_amount), 0).toLocaleString()}`, icon: Calculator, color: 'bg-blue-500' },
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

      {/* Quotations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Quotation #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Vehicle</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Request</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Days</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Total</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Valid Until</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.map((quotation) => {
                const statusStyle = getStatusBadge(quotation.status);
                const StatusIcon = statusStyle.icon;
                return (
                  <tr key={quotation.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{quotation.quotation_number}</p>
                      <p className="text-xs text-slate-500">{new Date(quotation.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-700">{quotation.vehicle?.make} {quotation.vehicle?.model}</p>
                          <p className="text-xs text-slate-500">{quotation.vehicle?.registration_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {quotation.request ? (
                        <div>
                          <p className="text-sm text-slate-700">{quotation.request.request_number}</p>
                          <p className="text-xs text-slate-500">{quotation.request.department?.name}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Direct quotation</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{quotation.total_days} days</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">R{Number(quotation.total_amount).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">R{quotation.daily_rate}/day</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {quotation.valid_until}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${statusStyle.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {quotation.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedQuotation(quotation)}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg">
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Detail Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedQuotation.quotation_number}</h2>
                  <p className="text-sm text-slate-500">Created {new Date(selectedQuotation.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedQuotation(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(selectedQuotation.status).bg}`}>
                  {selectedQuotation.status}
                </span>
                <span className="text-sm text-slate-500">Valid until {selectedQuotation.valid_until}</span>
              </div>

              {/* Vehicle Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-500 mb-3">Vehicle</h4>
                <div className="flex items-center gap-4">
                  {selectedQuotation.vehicle?.image_url && (
                    <img
                      src={selectedQuotation.vehicle.image_url}
                      alt={`${selectedQuotation.vehicle.make} ${selectedQuotation.vehicle.model}`}
                      className="w-20 h-15 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">
                      {selectedQuotation.vehicle?.make} {selectedQuotation.vehicle?.model}
                    </p>
                    <p className="text-sm text-slate-500">{selectedQuotation.vehicle?.registration_number}</p>
                    <p className="text-sm text-slate-500">{selectedQuotation.vehicle?.vehicle_type}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-800 mb-4">Pricing Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Daily Rate x {selectedQuotation.total_days} days</span>
                    <span className="font-medium text-slate-800">R{Number(selectedQuotation.base_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Insurance</span>
                    <span className="font-medium text-slate-800">R{Number(selectedQuotation.insurance_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Fuel Deposit</span>
                    <span className="font-medium text-slate-800">R{Number(selectedQuotation.fuel_deposit).toLocaleString()}</span>
                  </div>
                  {Number(selectedQuotation.additional_charges) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Additional Charges</span>
                      <span className="font-medium text-slate-800">R{Number(selectedQuotation.additional_charges).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedQuotation.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount</span>
                      <span className="font-medium text-green-600">-R{Number(selectedQuotation.discount_amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className="text-xl font-bold text-blue-600">R{Number(selectedQuotation.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedQuotation.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Notes</h4>
                  <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{selectedQuotation.notes}</p>
                </div>
              )}

              {/* Actions */}
              {(selectedQuotation.status === 'draft' || selectedQuotation.status === 'pending') && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  {selectedQuotation.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(selectedQuotation.id, 'pending')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                      Send for Approval
                    </button>
                  )}
                  {selectedQuotation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(selectedQuotation.id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedQuotation.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Create Quotation</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateQuotation} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Linked Request (Optional)</label>
                  <select
                    value={newQuotation.request_id}
                    onChange={(e) => setNewQuotation({ ...newQuotation, request_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No linked request</option>
                    {requests.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.request_number} - {req.department?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                  <select
                    value={newQuotation.vehicle_id}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registration_number}) - R{v.daily_rate}/day
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Daily Rate (ZAR)</label>
                  <input
                    type="number"
                    value={newQuotation.daily_rate}
                    onChange={(e) => setNewQuotation({ ...newQuotation, daily_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Days</label>
                  <input
                    type="number"
                    value={newQuotation.total_days}
                    onChange={(e) => setNewQuotation({ ...newQuotation, total_days: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Insurance (ZAR)</label>
                  <input
                    type="number"
                    value={newQuotation.insurance_amount}
                    onChange={(e) => setNewQuotation({ ...newQuotation, insurance_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Deposit (ZAR)</label>
                  <input
                    type="number"
                    value={newQuotation.fuel_deposit}
                    onChange={(e) => setNewQuotation({ ...newQuotation, fuel_deposit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Additional Charges ($)</label>
                  <input
                    type="number"
                    value={newQuotation.additional_charges}
                    onChange={(e) => setNewQuotation({ ...newQuotation, additional_charges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    value={newQuotation.discount_amount}
                    onChange={(e) => setNewQuotation({ ...newQuotation, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Total Preview */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Estimated Total</span>
                  <span className="text-2xl font-bold text-blue-600">${calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={newQuotation.notes}
                  onChange={(e) => setNewQuotation({ ...newQuotation, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;
