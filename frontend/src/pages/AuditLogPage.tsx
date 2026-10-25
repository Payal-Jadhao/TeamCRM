import React, { useState, useEffect } from 'react';
import { auditApi } from '../services/api';
import type { AuditLogItem } from '../types';
import { History, Shield, Filter, Search } from 'lucide-react';
import { TableLoader } from '../components/ui/LoadingSpinner';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filterEntity]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditApi.getLogs(
        filterEntity !== 'ALL' ? { entityName: filterEntity } : undefined
      );
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(term)) ||
      (l.newValue && l.newValue.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">System Compliance & Security Audit Logs</h1>
            <span className="text-[10px] uppercase font-bold bg-purple-100 text-primary px-2 py-0.5 rounded-full">
              Tamper Proof
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Immutable log of status transitions, manual time adjustments, permission delegations, and API publications.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-3 py-1.5 text-xs bg-purple-50 text-text-primary rounded-lg border border-border-custom outline-none"
          >
            <option value="ALL">All Modules</option>
            <option value="TASK">Task Transitions</option>
            <option value="TASK_TIME_LOG">Time Adjustments</option>
            <option value="USER">User & Permissions</option>
            <option value="API_DOC">API Handoff Specs</option>
            <option value="MEETING">Meetings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-border-custom shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50 text-text-secondary font-bold uppercase tracking-wider border-b border-border-custom">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">Action Code</th>
                <th className="px-6 py-3.5">Target Entity</th>
                <th className="px-6 py-3.5">Audit Transition / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {loading ? (
                <TableLoader colSpan={5} message="Loading audit logs..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-secondary text-xs">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-text-secondary whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">
                      {log.actorEmail || 'System Automated'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-100 text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-secondary">
                      {log.entityName} #{log.entityId || ''}
                    </td>
                    <td className="px-6 py-4 text-text-primary font-medium">
                      {log.oldValue && (
                        <span className="line-through text-rose-500 mr-2">{log.oldValue}</span>
                      )}
                      {log.newValue ? (
                        <span className="text-emerald-700 font-semibold">{log.newValue}</span>
                      ) : (
                        'Recorded change'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
