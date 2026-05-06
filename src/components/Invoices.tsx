import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Invoice, Payment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Can } from '@/components/ProtectedRoute';
import {
  Search,
  Plus,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  Download,
  CreditCard,
  Printer,
  Lock
} from 'lucide-react';

const Invoices: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      let invoicesQuery = supabase
        .from('invoices')
        .select('*, rental:rentals(*, vehicle:vehicles(*)), department:government_departments(*)')
        .order('issued_date', { ascending: false });

      // Government approvers can only see their department's invoices
      if (user?.role === 'government_approver' && user.departmentId) {
        invoicesQuery = invoicesQuery.eq('department_id', user.departmentId);
      }

      const [invoicesRes, paymentsRes] = await Promise.all([
        invoicesQuery,
        supabase.from('payments').select('*').order('payment_date', { ascending: false }),
      ]);

      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.department?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ElementType }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      partial: { bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
      paid: { bg: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      overdue: { bg: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    };
    return styles[status] || styles.pending;
  };

  const getInvoicePayments = (invoiceId: string) => {
    return payments.filter((p) => p.invoice_id === invoiceId);
  };

  const getTotalPaid = (invoiceId: string) => {
    return getInvoicePayments(invoiceId).reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    if (!hasPermission('record_payments')) {
      alert('You do not have permission to record payments');
      return;
    }

    try {
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payments.length + 3).padStart(4, '0')}`;
      const amount = parseFloat(paymentAmount);
      const totalPaid = getTotalPaid(selectedInvoice.id) + amount;
      const newStatus = totalPaid >= selectedInvoice.total_amount ? 'paid' : 'partial';

      await supabase.from('payments').insert({
        payment_number: paymentNumber,
        invoice_id: selectedInvoice.id,
        amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        payment_date: new Date().toISOString().split('T')[0],
      });

      await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', selectedInvoice.id);

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReference('');
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalPending = invoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'partial')
    .reduce((sum, inv) => sum + Number(inv.total_amount) - getTotalPaid(inv.id), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + getTotalPaid(inv.id), 0);

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
              placeholder="Search invoices..."
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
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Revenue Stats - Only visible to finance and admin */}
      <Can permission="manage_invoices">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800">R{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Collected</p>
                <p className="text-2xl font-bold text-green-600">R{totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">R{totalPending.toLocaleString()}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Invoices</p>
                <p className="text-2xl font-bold text-slate-800">{invoices.length}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Can>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Invoice #</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Department</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rental</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Paid</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Due Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((invoice) => {
                const statusStyle = getStatusBadge(invoice.status);
                const StatusIcon = statusStyle.icon;
                const paid = getTotalPaid(invoice.id);
                const balance = Number(invoice.total_amount) - paid;

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{invoice.invoice_number}</p>
                      <p className="text-xs text-slate-500">{invoice.issued_date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{invoice.department?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{invoice.rental?.rental_number}</p>
                      <p className="text-xs text-slate-500">
                        {invoice.rental?.vehicle?.make} {invoice.rental?.vehicle?.model}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">R{Number(invoice.total_amount).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-green-600">R{paid.toLocaleString()}</p>
                      {balance > 0 && (
                        <p className="text-xs text-orange-600">Balance: R{balance.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {invoice.due_date}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${statusStyle.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg" title="Download">
                          <Download className="w-4 h-4 text-slate-500" />
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && !showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedInvoice.invoice_number}</h2>
                  <p className="text-sm text-slate-500">Issued {selectedInvoice.issued_date}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status & Department */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-800">{selectedInvoice.department?.name}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(selectedInvoice.status).bg}`}>
                  {selectedInvoice.status}
                </span>
              </div>

              {/* Line Items */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-800 mb-4">Invoice Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Rental Amount</span>
                    <span className="font-medium text-slate-800">R{Number(selectedInvoice.rental_amount).toLocaleString()}</span>
                  </div>
                  {Number(selectedInvoice.fuel_charges) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Fuel Charges</span>
                      <span className="font-medium text-slate-800">R{Number(selectedInvoice.fuel_charges).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.damage_charges) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Damage Charges</span>
                      <span className="font-medium text-red-600">R{Number(selectedInvoice.damage_charges).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.late_fees) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Late Fees</span>
                      <span className="font-medium text-orange-600">R{Number(selectedInvoice.late_fees).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.other_charges) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Other Charges</span>
                      <span className="font-medium text-slate-800">R{Number(selectedInvoice.other_charges).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Discount</span>
                      <span className="font-medium text-green-600">-R{Number(selectedInvoice.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-3 flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-800">R{Number(selectedInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax (15%)</span>
                    <span className="font-medium text-slate-800">R{Number(selectedInvoice.tax_amount).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between">
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className="text-xl font-bold text-slate-800">R{Number(selectedInvoice.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3">Payment History</h4>
                {getInvoicePayments(selectedInvoice.id).length > 0 ? (
                  <div className="space-y-2">
                    {getInvoicePayments(selectedInvoice.id).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-slate-800">{payment.payment_number}</p>
                          <p className="text-sm text-slate-500">{payment.payment_date} - {payment.payment_method}</p>
                        </div>
                        <span className="font-bold text-green-600">R{Number(payment.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No payments recorded yet</p>
                )}
              </div>

              {/* Balance */}
              {selectedInvoice.status !== 'paid' && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-orange-800">Outstanding Balance</span>
                    <span className="text-xl font-bold text-orange-600">
                      R{(Number(selectedInvoice.total_amount) - getTotalPaid(selectedInvoice.id)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {selectedInvoice.status !== 'paid' && (
                  <Can 
                    permission="record_payments"
                    fallback={
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-lg">
                        <Lock className="w-4 h-4" />
                        <span>No permission to record payments</span>
                      </div>
                    }
                  >
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CreditCard className="w-4 h-4" />
                      Record Payment
                    </button>
                  </Can>
                )}
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Record Payment</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">Invoice</p>
                <p className="font-medium text-slate-800">{selectedInvoice.invoice_number}</p>
                <p className="text-sm text-slate-500 mt-2">Outstanding Balance</p>
                <p className="text-xl font-bold text-orange-600">
                  R{(Number(selectedInvoice.total_amount) - getTotalPaid(selectedInvoice.id)).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Amount (ZAR)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  max={Number(selectedInvoice.total_amount) - getTotalPaid(selectedInvoice.id)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Bank Transfer</option>
                  <option>Check</option>
                  <option>Cash</option>
                  <option>Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TRF-XXX-XXXXXXXX"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
