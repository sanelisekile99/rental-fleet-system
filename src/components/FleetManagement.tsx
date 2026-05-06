import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { Can } from '@/components/ProtectedRoute';
import { toast } from '@/components/ui/use-toast';
import {
  Search,
  Filter,
  Plus,
  Grid,
  List,
  Car,
  Fuel,
  Calendar,
  MapPin,
  Settings,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Lock
} from 'lucide-react';

const FleetManagement: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const { navigateToView, setSelectedVehicleForRequest } = useAppContext();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('registration_number');

      // Government users can only see available vehicles
      if (user?.role === 'government_user') {
        query = query.eq('status', 'available');
      }

      const { data, error } = await query;

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      // Provide demo data when database is not available
      const demoVehicles = [
        {
          id: 'demo-1',
          registration_number: 'NNZ 150 DBN',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          vehicle_type: 'Sedan',
          color: 'Black',
          fuel_type: 'Petrol',
          transmission: 'Automatic',
          seating_capacity: 5,
          daily_rate: 150,
          current_mileage: 5000,
          status: 'available' as const,
          current_location: 'Main Depot, Durban',
          image_url: '/placeholder.svg',
          insurance_expiry: '2024-12-31',
          last_service_date: '2024-10-01',
          next_service_due: '2025-01-01',
          created_at: '2024-01-01',
          updated_at: '2024-11-01'
        },
        {
          id: 'demo-2',
          registration_number: 'NNZ 140 DBN',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          vehicle_type: 'Sedan',
          color: 'Black',
          fuel_type: 'Petrol',
          transmission: 'Automatic',
          seating_capacity: 5,
          daily_rate: 140,
          current_mileage: 3000,
          status: 'available' as const,
          current_location: 'Main Depot, Durban',
          image_url: '/placeholder.svg',
          insurance_expiry: '2024-12-31',
          last_service_date: '2024-09-15',
          next_service_due: '2024-12-15',
          created_at: '2024-01-01',
          updated_at: '2024-11-01'
        },
        {
          id: 'demo-3',
          registration_number: 'NNZ 150 DBN',
          make: 'Toyota',
          model: 'Camry',
          year: 2024,
          vehicle_type: 'Sedan',
          color: 'Black',
          fuel_type: 'Hybrid',
          transmission: 'Automatic',
          seating_capacity: 5,
          daily_rate: 180,
          current_mileage: 1200,
          status: 'available' as const,
          current_location: 'Main Depot, Durban',
          image_url: '/placeholder.svg',
          insurance_expiry: '2024-12-31',
          last_service_date: '2024-10-15',
          next_service_due: '2025-01-15',
          created_at: '2024-01-01',
          updated_at: '2024-11-01'
        },
        {
          id: 'demo-4',
          registration_number: 'NNZ 350 DBN',
          make: 'Toyota',
          model: 'Land Cruiser',
          year: 2023,
          vehicle_type: 'SUV',
          color: 'White',
          fuel_type: 'Diesel',
          transmission: 'Automatic',
          seating_capacity: 8,
          daily_rate: 350,
          current_mileage: 2500,
          status: 'available' as const,
          current_location: 'Main Depot, Durban',
          image_url: '/placeholder.svg',
          insurance_expiry: '2024-12-31',
          last_service_date: '2024-11-01',
          next_service_due: '2025-02-01',
          created_at: '2024-01-01',
          updated_at: '2024-11-01'
        }
      ];
      
      // Filter demo data based on user role
      const filteredDemoVehicles = user?.role === 'government_user' 
        ? demoVehicles.filter(v => v.status === 'available')
        : demoVehicles;
        
      setVehicles(filteredDemoVehicles);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    const matchesType = filterType === 'all' || vehicle.vehicle_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const vehicleTypes = [...new Set(vehicles.map((v) => v.vehicle_type))];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-700 border-green-200',
      rented: 'bg-blue-100 text-blue-700 border-blue-200',
      maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      reserved: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const handleStatusChange = async (vehicleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', vehicleId);

      if (error) throw error;
      fetchVehicles();
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {user?.role === 'government_user' ? 'Available Vehicles' : 'Fleet Management'}
          </h2>
          <p className="text-slate-500">
            {user?.role === 'government_user' 
              ? 'Browse available vehicles for rental requests' 
              : 'Manage your vehicle fleet'
            }
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={user?.role === 'government_user' ? 'Search available vehicles...' : 'Search vehicles...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle - Only for non-government users */}
          {user?.role !== 'government_user' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Vehicle - Only for admin users */}
          {user?.role !== 'government_user' && (
            <Can permission="manage_fleet">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </Can>
          )}
        </div>
      </div>

      {/* Filters Panel - Hidden for government users */}
      {showFilters && user?.role !== 'government_user' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterType('all');
                setSearchTerm('');
              }}
              className="self-end px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vehicles', count: vehicles.length, color: 'bg-slate-500' },
          { label: 'Available', count: vehicles.filter((v) => v.status === 'available').length, color: 'bg-green-500' },
          { label: 'Rented', count: vehicles.filter((v) => v.status === 'rented').length, color: 'bg-blue-500' },
          { label: 'Maintenance', count: vehicles.filter((v) => v.status === 'maintenance').length, color: 'bg-yellow-500' },
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

      {/* Vehicle Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <div className="aspect-[4/3] bg-slate-100 relative">
                <img
                  src={vehicle.image_url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(
                    vehicle.status
                  )}`}
                >
                  {vehicle.status}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-slate-500">{vehicle.registration_number}</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">R{vehicle.daily_rate}/day</span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {vehicle.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    {vehicle.fuel_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    {vehicle.vehicle_type}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{vehicle.current_location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Vehicle</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Registration</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Daily Rate</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Location</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={vehicle.image_url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-slate-800">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-slate-500">{vehicle.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.registration_number}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicle.vehicle_type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(vehicle.status)}`}
                    >
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">R{vehicle.daily_rate}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-[150px] truncate">
                    {vehicle.current_location}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                      <button className="p-1 hover:bg-slate-100 rounded">
                        <Edit className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedVehicle.image_url}
                alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => setSelectedVehicle(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
              <span
                className={`absolute top-4 left-4 px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(
                  selectedVehicle.status
                )}`}
              >
                {selectedVehicle.status}
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </h2>
                  <p className="text-slate-500">{selectedVehicle.registration_number}</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">R{selectedVehicle.daily_rate}/day</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Year</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.year}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.vehicle_type}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Color</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.color}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Fuel Type</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.fuel_type}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Transmission</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.transmission}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Seating</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.seating_capacity} seats</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Current Mileage</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.current_mileage.toLocaleString()} km</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Insurance Expiry</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.insurance_expiry}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Next Service</p>
                  <p className="font-medium text-slate-800">{selectedVehicle.next_service_due}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-500 mb-1">Current Location</p>
                <div className="flex items-center gap-2 text-slate-800">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{selectedVehicle.current_location}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                {user?.role === 'government_user' ? (
                  // Simple action for government users
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-4">
                      Interested in renting this vehicle?
                    </p>
                    <button
                      onClick={() => {
                        setSelectedVehicleForRequest(selectedVehicle);
                        toast({
                          title: "Redirecting to Rental Requests",
                          description: `Ready to request ${selectedVehicle.make} ${selectedVehicle.model}`,
                        });
                        setSelectedVehicle(null);
                        navigateToView('requests');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Request This Vehicle
                    </button>
                  </div>
                ) : (
                  // Fleet management actions for other users
                  <>
                    <p className="text-sm font-medium text-slate-700 mb-3">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVehicle.status !== 'available' && (
                        <button
                          onClick={() => handleStatusChange(selectedVehicle.id, 'available')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Mark Available
                        </button>
                      )}
                      {selectedVehicle.status !== 'maintenance' && (
                        <button
                          onClick={() => handleStatusChange(selectedVehicle.id, 'maintenance')}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Send to Maintenance
                        </button>
                      )}
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                        <Edit className="w-4 h-4" />
                        Edit Details
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Add New Vehicle</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration No.</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="NNZ 123 DBN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Camry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Sedan</option>
                    <option>SUV</option>
                    <option>Van</option>
                    <option>Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Daily Rate (ZAR)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No vehicles found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
