import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuditLog } from '@/types';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FileText,
  Car,
  Receipt,
  Key,
  Download,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(log.created_at) >= new Date(dateFrom);
    }
    if (dateTo) {
      matchesDate = matchesDate && new Date(log.created_at) <= new Date(dateTo + 'T23:59:59');
    }
    
    return matchesSearch && matchesEntity && matchesAction && matchesDate;
  });

  const entityTypes = [...new Set(logs.map((l) => l.entity_type))];
  const actionTypes = [...new Set(logs.map((l) => l.action))];

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, React.ElementType> = {
      vehicle: Car,
      rental: Key,
      rental_request: FileText,
      invoice: Receipt,
      payment: Receipt,
    };
    return icons[entityType] || FileText;
  };

  const getEntityColor = (entityType: string) => {
    const colors: Record<string, string> = {
      vehicle: 'bg-blue-100 text-blue-600',
      rental: 'bg-purple-100 text-purple-600',
      rental_request: 'bg-orange-100 text-orange-600',
      invoice: 'bg-green-100 text-green-600',
      payment: 'bg-emerald-100 text-emerald-600',
    };
    return colors[entityType] || 'bg-slate-100 text-slate-600';
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      created: 'bg-green-100 text-green-700',
      updated: 'bg-blue-100 text-blue-700',
      deleted: 'bg-red-100 text-red-700',
      status_change: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-emerald-100 text-emerald-700',
      payment_received: 'bg-green-100 text-green-700',
    };
    return styles[action] || 'bg-slate-100 text-slate-700';
  };

  const formatChanges = (oldValues: Record<string, any>, newValues: Record<string, any>) => {
    const changes: { field: string; old: any; new: any }[] = [];
    
    if (newValues) {
      Object.keys(newValues).forEach((key) => {
        const oldVal = oldValues?.[key];
        const newVal = newValues[key];
        if (oldVal !== newVal) {
          changes.push({ field: key, old: oldVal, new: newVal });
        }
      });
    }
    
    return changes;
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Entity Type</label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Entities</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setFilterEntity('all');
              setFilterAction('all');
              setDateFrom('');
              setDateTo('');
              setSearchTerm('');
            }}
            className="self-end px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs', count: logs.length, color: 'bg-slate-500' },
          { label: 'Today', count: logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: 'bg-blue-500' },
          { label: 'This Week', count: logs.filter((l) => {
            const logDate = new Date(l.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return logDate >= weekAgo;
          }).length, color: 'bg-green-500' },
          { label: 'Filtered Results', count: filteredLogs.length, color: 'bg-purple-500' },
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

      {/* Audit Log List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => {
            const EntityIcon = getEntityIcon(log.entity_type);
            const isExpanded = expandedLog === log.id;
            const changes = formatChanges(log.old_values, log.new_values);

            return (
              <div key={log.id} className="hover:bg-slate-50">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getEntityColor(log.entity_type)}`}>
                        <EntityIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 capitalize">
                            {log.entity_type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionBadge(log.action)}`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Entity ID: {log.entity_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      {/* Old Values */}
                      {log.old_values && Object.keys(log.old_values).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Previous Values</h4>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <pre className="text-xs text-slate-600 overflow-x-auto">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* New Values */}
                      {log.new_values && Object.keys(log.new_values).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">New Values</h4>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <pre className="text-xs text-slate-600 overflow-x-auto">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Changes Summary */}
                    {changes.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Changes</h4>
                        <div className="space-y-2">
                          {changes.map((change, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-slate-700 capitalize">
                                {change.field.replace('_', ' ')}:
                              </span>
                              <span className="text-red-600 line-through">
                                {String(change.old || 'null')}
                              </span>
                              <span className="text-slate-400">→</span>
                              <span className="text-green-600">{String(change.new)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>Log ID: {log.id}</span>
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                        {log.user_id && <span>User: {log.user_id.slice(0, 8)}...</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No audit logs found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
