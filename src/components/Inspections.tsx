import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Rental } from '@/types';
import {
  Search,
  Plus,
  ClipboardCheck,
  Car,
  Calendar,
  User,
  Camera,
  AlertTriangle,
  CheckCircle,
  Eye,
  X,
  Fuel,
  Gauge,
  ThermometerSun,
  Lightbulb
} from 'lucide-react';

interface Inspection {
  id: string;
  rental_id: string;
  inspection_type: 'handover' | 'return';
  inspection_date: string;
  exterior_condition: string;
  interior_condition: string;
  tire_condition: string;
  lights_working: boolean;
  ac_working: boolean;
  fuel_level: string;
  mileage: number;
  damage_reported: boolean;
  damage_description: string;
  damage_severity: string;
  notes: string;
  signed_by: string;
  rental?: Rental;
}

const Inspections: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInspection, setNewInspection] = useState({
    rental_id: '',
    inspection_type: 'handover' as 'handover' | 'return',
    exterior_condition: 'good',
    interior_condition: 'good',
    tire_condition: 'good',
    lights_working: true,
    ac_working: true,
    fuel_level: 'Full',
    mileage: 0,
    damage_reported: false,
    damage_description: '',
    damage_severity: '',
    notes: '',
    signed_by: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inspectionsRes, rentalsRes] = await Promise.all([
        supabase
          .from('inspections')
          .select('*, rental:rentals(*, vehicle:vehicles(*), department:government_departments(*))')
          .order('inspection_date', { ascending: false }),
        supabase
          .from('rentals')
          .select('*, vehicle:vehicles(*), department:government_departments(*)')
          .in('status', ['active', 'scheduled']),
      ]);

      if (inspectionsRes.data) setInspections(inspectionsRes.data);
      if (rentalsRes.data) setRentals(rentalsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      inspection.rental?.rental_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.rental?.vehicle?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || inspection.inspection_type === filterType;
    return matchesSearch && matchesType;
  });

  const getConditionBadge = (condition: string) => {
    const styles: Record<string, string> = {
      excellent: 'bg-green-100 text-green-700',
      good: 'bg-blue-100 text-blue-700',
      fair: 'bg-yellow-100 text-yellow-700',
      poor: 'bg-red-100 text-red-700',
    };
    return styles[condition] || 'bg-slate-100 text-slate-700';
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('inspections').insert({
        ...newInspection,
        inspection_date: new Date().toISOString(),
      });

      if (error) throw error;
      setShowCreateModal(false);
      setNewInspection({
        rental_id: '',
        inspection_type: 'handover',
        exterior_condition: 'good',
        interior_condition: 'good',
        tire_condition: 'good',
        lights_working: true,
        ac_working: true,
        fuel_level: 'Full',
        mileage: 0,
        damage_reported: false,
        damage_description: '',
        damage_severity: '',
        notes: '',
        signed_by: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating inspection:', error);
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
              placeholder="Search inspections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="handover">Handover</option>
            <option value="return">Return</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Inspections', count: inspections.length, icon: ClipboardCheck, color: 'bg-slate-500' },
          { label: 'Handovers', count: inspections.filter((i) => i.inspection_type === 'handover').length, icon: Car, color: 'bg-blue-500' },
          { label: 'Returns', count: inspections.filter((i) => i.inspection_type === 'return').length, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Damage Reported', count: inspections.filter((i) => i.damage_reported).length, icon: AlertTriangle, color: 'bg-red-500' },
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

      {/* Inspections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInspections.map((inspection) => (
          <div
            key={inspection.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
              inspection.damage_reported ? 'border-red-200' : 'border-slate-100'
            }`}
            onClick={() => setSelectedInspection(inspection)}
          >
            <div className={`px-4 py-3 ${inspection.inspection_type === 'handover' ? 'bg-blue-50' : 'bg-green-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  inspection.inspection_type === 'handover' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {inspection.inspection_type}
                </span>
                <span className="text-sm text-slate-500">{new Date(inspection.inspection_date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Vehicle Info */}
              <div className="flex items-center gap-3">
                {inspection.rental?.vehicle?.image_url && (
                  <img
                    src={inspection.rental.vehicle.image_url}
                    alt={`${inspection.rental.vehicle.make} ${inspection.rental.vehicle.model}`}
                    className="w-16 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-slate-800">
                    {inspection.rental?.vehicle?.make} {inspection.rental?.vehicle?.model}
                  </p>
                  <p className="text-sm text-slate-500">{inspection.rental?.vehicle?.registration_number}</p>
                </div>
              </div>

              {/* Rental Info */}
              <div className="text-sm text-slate-600">
                <p>Rental: {inspection.rental?.rental_number}</p>
              </div>

              {/* Condition Summary */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getConditionBadge(inspection.exterior_condition)}`}>
                  Ext: {inspection.exterior_condition}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getConditionBadge(inspection.interior_condition)}`}>
                  Int: {inspection.interior_condition}
                </span>
              </div>

              {/* Damage Alert */}
              {inspection.damage_reported && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Damage reported - {inspection.damage_severity}</span>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <Fuel className="w-4 h-4" />
                  {inspection.fuel_level}
                </div>
                <div className="flex items-center gap-1">
                  <Gauge className="w-4 h-4" />
                  {inspection.mileage?.toLocaleString()} km
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 capitalize">{selectedInspection.inspection_type} Inspection</h2>
                  <p className="text-sm text-slate-500">{new Date(selectedInspection.inspection_date).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedInspection(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Vehicle */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-500 mb-3">Vehicle</h4>
                <div className="flex items-center gap-4">
                  {selectedInspection.rental?.vehicle?.image_url && (
                    <img
                      src={selectedInspection.rental.vehicle.image_url}
                      alt={`${selectedInspection.rental.vehicle.make} ${selectedInspection.rental.vehicle.model}`}
                      className="w-24 h-18 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">
                      {selectedInspection.rental?.vehicle?.make} {selectedInspection.rental?.vehicle?.model}
                    </p>
                    <p className="text-sm text-slate-500">{selectedInspection.rental?.vehicle?.registration_number}</p>
                    <p className="text-sm text-slate-500">Rental: {selectedInspection.rental?.rental_number}</p>
                  </div>
                </div>
              </div>

              {/* Condition Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Car className="w-4 h-4" />
                    <span className="text-sm">Exterior</span>
                  </div>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getConditionBadge(selectedInspection.exterior_condition)}`}>
                    {selectedInspection.exterior_condition}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Car className="w-4 h-4" />
                    <span className="text-sm">Interior</span>
                  </div>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getConditionBadge(selectedInspection.interior_condition)}`}>
                    {selectedInspection.interior_condition}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Car className="w-4 h-4" />
                    <span className="text-sm">Tires</span>
                  </div>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${getConditionBadge(selectedInspection.tire_condition)}`}>
                    {selectedInspection.tire_condition}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm">Lights</span>
                  </div>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                    selectedInspection.lights_working ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedInspection.lights_working ? 'Working' : 'Not Working'}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <ThermometerSun className="w-4 h-4" />
                    <span className="text-sm">A/C</span>
                  </div>
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                    selectedInspection.ac_working ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedInspection.ac_working ? 'Working' : 'Not Working'}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Fuel className="w-4 h-4" />
                    <span className="text-sm">Fuel Level</span>
                  </div>
                  <p className="font-medium text-slate-800">{selectedInspection.fuel_level}</p>
                </div>
              </div>

              {/* Mileage */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Gauge className="w-4 h-4" />
                    <span className="text-sm">Odometer Reading</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800">{selectedInspection.mileage?.toLocaleString()} km</p>
                </div>
              </div>

              {/* Damage Report */}
              {selectedInspection.damage_reported && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-medium">Damage Report</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600">Severity:</span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        {selectedInspection.damage_severity}
                      </span>
                    </div>
                    <p className="text-sm text-red-700">{selectedInspection.damage_description}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInspection.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Notes</h4>
                  <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{selectedInspection.notes}</p>
                </div>
              )}

              {/* Signed By */}
              {selectedInspection.signed_by && (
                <div className="flex items-center gap-2 text-sm text-slate-600 pt-4 border-t border-slate-100">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Signed by: {selectedInspection.signed_by}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Inspection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">New Inspection</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateInspection} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rental</label>
                  <select
                    value={newInspection.rental_id}
                    onChange={(e) => setNewInspection({ ...newInspection, rental_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Rental</option>
                    {rentals.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rental_number} - {r.vehicle?.make} {r.vehicle?.model} ({r.vehicle?.registration_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inspection Type</label>
                  <select
                    value={newInspection.inspection_type}
                    onChange={(e) => setNewInspection({ ...newInspection, inspection_type: e.target.value as 'handover' | 'return' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="handover">Handover</option>
                    <option value="return">Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    value={newInspection.mileage}
                    onChange={(e) => setNewInspection({ ...newInspection, mileage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Exterior Condition</label>
                  <select
                    value={newInspection.exterior_condition}
                    onChange={(e) => setNewInspection({ ...newInspection, exterior_condition: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interior Condition</label>
                  <select
                    value={newInspection.interior_condition}
                    onChange={(e) => setNewInspection({ ...newInspection, interior_condition: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tire Condition</label>
                  <select
                    value={newInspection.tire_condition}
                    onChange={(e) => setNewInspection({ ...newInspection, tire_condition: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Level</label>
                  <select
                    value={newInspection.fuel_level}
                    onChange={(e) => setNewInspection({ ...newInspection, fuel_level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Full">Full</option>
                    <option value="3/4">3/4</option>
                    <option value="Half">Half</option>
                    <option value="1/4">1/4</option>
                    <option value="Empty">Empty</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newInspection.lights_working}
                    onChange={(e) => setNewInspection({ ...newInspection, lights_working: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Lights Working</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newInspection.ac_working}
                    onChange={(e) => setNewInspection({ ...newInspection, ac_working: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">A/C Working</span>
                </label>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={newInspection.damage_reported}
                    onChange={(e) => setNewInspection({ ...newInspection, damage_reported: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-red-600">Report Damage</span>
                </label>
                {newInspection.damage_reported && (
                  <div className="space-y-3 bg-red-50 rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                      <select
                        value={newInspection.damage_severity}
                        onChange={(e) => setNewInspection({ ...newInspection, damage_severity: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Severity</option>
                        <option value="minor">Minor</option>
                        <option value="moderate">Moderate</option>
                        <option value="major">Major</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea
                        value={newInspection.damage_description}
                        onChange={(e) => setNewInspection({ ...newInspection, damage_description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={newInspection.notes}
                  onChange={(e) => setNewInspection({ ...newInspection, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Signed By</label>
                <input
                  type="text"
                  value={newInspection.signed_by}
                  onChange={(e) => setNewInspection({ ...newInspection, signed_by: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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
                  Create Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredInspections.length === 0 && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No inspections found</h3>
          <p className="text-slate-500">Create a new inspection to get started</p>
        </div>
      )}
    </div>
  );
};

export default Inspections;
