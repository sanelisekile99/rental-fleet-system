import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Rental } from '@/types';
import {
  Search,
  Filter,
  Car,
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  X,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';

const ActiveRentals: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select('*, vehicle:vehicles(*), department:government_departments(*)')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch =
      rental.rental_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rental.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-purple-100 text-purple-700 border-purple-200',
      active: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return styles[status] || styles.scheduled;
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleCompleteRental = async (rentalId: string, vehicleId: string) => {
    try {
      await supabase
        .from('rentals')
        .update({
          status: 'completed',
          actual_end_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', rentalId);

      await supabase
        .from('vehicles')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', vehicleId);

      fetchRentals();
      setSelectedRental(null);
    } catch (error) {
      console.error('Error completing rental:', error);
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
              placeholder="Search rentals..."
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
            <option value="scheduled">Scheduled</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button
          onClick={fetchRentals}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rentals', count: rentals.length, color: 'bg-slate-500' },
          { label: 'Active', count: rentals.filter((r) => r.status === 'active').length, color: 'bg-blue-500' },
          { label: 'Scheduled', count: rentals.filter((r) => r.status === 'scheduled').length, color: 'bg-purple-500' },
          { label: 'Completed', count: rentals.filter((r) => r.status === 'completed').length, color: 'bg-green-500' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.count}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rentals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRentals.map((rental) => {
          const daysRemaining = getDaysRemaining(rental.expected_end_date);
          const isOverdue = rental.status === 'active' && daysRemaining < 0;
          const isDueSoon = rental.status === 'active' && daysRemaining >= 0 && daysRemaining <= 2;

          return (
            <div
              key={rental.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                isOverdue ? 'border-red-300' : isDueSoon ? 'border-yellow-300' : 'border-slate-100'
              }`}
              onClick={() => setSelectedRental(rental)}
            >
              {/* Header */}
              <div className={`px-4 py-3 ${isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{rental.rental_number}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(rental.status)}`}>
                    {rental.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Vehicle Info */}
                <div className="flex items-center gap-3">
                  {rental.vehicle?.image_url && (
                    <img
                      src={rental.vehicle.image_url}
                      alt={`${rental.vehicle.make} ${rental.vehicle.model}`}
                      className="w-16 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-slate-800">
                      {rental.vehicle?.make} {rental.vehicle?.model}
                    </p>
                    <p className="text-sm text-slate-500">{rental.vehicle?.registration_number}</p>
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{rental.department?.name}</span>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{rental.driver_name}</span>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{rental.start_date}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{rental.expected_end_date}</span>
                </div>

                {/* Status Alert */}
                {rental.status === 'active' && (
                  <div
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                      isOverdue
                        ? 'bg-red-100 text-red-700'
                        : isDueSoon
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isOverdue ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Overdue by {Math.abs(daysRemaining)} days</span>
                      </>
                    ) : isDueSoon ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Due in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>{daysRemaining} days remaining</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rental Detail Modal */}
      {selectedRental && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedRental.rental_number}</h2>
                  <p className="text-sm text-slate-500">Started {selectedRental.start_date}</p>
                </div>
                <button onClick={() => setSelectedRental(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(selectedRental.status)}`}>
                  {selectedRental.status}
                </span>
                {selectedRental.extended_days > 0 && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-700">
                    Extended {selectedRental.extended_days} days
                  </span>
                )}
              </div>

              {/* Vehicle */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-500 mb-3">Vehicle Details</h4>
                <div className="flex items-center gap-4">
                  {selectedRental.vehicle?.image_url && (
                    <img
                      src={selectedRental.vehicle.image_url}
                      alt={`${selectedRental.vehicle.make} ${selectedRental.vehicle.model}`}
                      className="w-24 h-18 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">
                      {selectedRental.vehicle?.make} {selectedRental.vehicle?.model}
                    </p>
                    <p className="text-sm text-slate-500">{selectedRental.vehicle?.registration_number}</p>
                    <p className="text-sm text-slate-500">{selectedRental.vehicle?.vehicle_type} - {selectedRental.vehicle?.color}</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Driver</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRental.driver_name}</p>
                  <p className="text-sm text-slate-500">{selectedRental.driver_license}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Contact</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRental.driver_phone}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Department</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRental.department?.name}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Period</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedRental.start_date} - {selectedRental.expected_end_date}</p>
                </div>
              </div>

              {/* Mileage & Fuel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500 mb-1">Start Mileage</p>
                  <p className="font-medium text-slate-800">{selectedRental.start_mileage?.toLocaleString()} km</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-500 mb-1">Start Fuel Level</p>
                  <p className="font-medium text-slate-800">{selectedRental.start_fuel_level}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedRental.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Notes</h4>
                  <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{selectedRental.notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedRental.status === 'active' && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleCompleteRental(selectedRental.id, selectedRental.vehicle_id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Rental
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <FileText className="w-4 h-4" />
                    Create Inspection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredRentals.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No rentals found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default ActiveRentals;
