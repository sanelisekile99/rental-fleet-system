export interface Vehicle {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: string;
  color: string;
  fuel_type: string;
  transmission: string;
  seating_capacity: number;
  daily_rate: number;
  current_mileage: number;
  status: 'available' | 'rented' | 'maintenance' | 'reserved';
  current_location: string;
  image_url: string;
  insurance_expiry: string;
  last_service_date: string;
  next_service_due: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  budget_allocation: number;
  created_at: string;
}

export interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  role: 'government_user' | 'government_approver' | 'rental_admin' | 'inspector' | 'fleet_manager';
  department_id: string | null;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface RentalRequest {
  id: string;
  request_number: string;
  department_id: string;
  requester_id: string | null;
  vehicle_type_requested: string;
  purpose: string;
  start_date: string;
  end_date: string;
  pickup_location: string;
  dropoff_location: string;
  driver_name: string;
  driver_license: string;
  special_requirements: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  request_id: string;
  vehicle_id: string;
  daily_rate: number;
  total_days: number;
  base_amount: number;
  insurance_amount: number;
  fuel_deposit: number;
  additional_charges: number;
  discount_amount: number;
  total_amount: number;
  valid_until: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  notes: string;
  created_by: string;
  created_at: string;
  vehicle?: Vehicle;
  request?: RentalRequest;
}

export interface Rental {
  id: string;
  rental_number: string;
  quotation_id: string | null;
  vehicle_id: string;
  department_id: string;
  driver_name: string;
  driver_license: string;
  driver_phone: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  start_mileage: number;
  end_mileage: number | null;
  start_fuel_level: string;
  end_fuel_level: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  extended_days: number;
  early_return_days: number;
  notes: string;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
  department?: Department;
}

export interface Inspection {
  id: string;
  rental_id: string;
  inspection_type: 'handover' | 'return';
  inspector_id: string;
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
  damage_severity: 'minor' | 'moderate' | 'major' | null;
  photos: string[];
  notes: string;
  signed_by: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  rental_id: string;
  department_id: string;
  rental_amount: number;
  fuel_charges: number;
  damage_charges: number;
  late_fees: number;
  other_charges: number;
  discount: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  due_date: string;
  issued_date: string;
  notes: string;
  created_at: string;
  rental?: Rental;
  department?: Department;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  received_by: string | null;
  notes: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string | null;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  activeRentals: number;
  pendingRequests: number;
  pendingApprovals: number;
  monthlyRevenue: number;
  fleetUtilization: number;
  overdueRentals: number;
}

export type ViewType = 'dashboard' | 'fleet' | 'requests' | 'quotations' | 'rentals' | 'inspections' | 'invoices' | 'reports' | 'audit' | 'settings';
