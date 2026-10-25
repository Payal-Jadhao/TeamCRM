import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeApi, taskApi, userApi } from '../services/api';
import type { TimeLog, Task, User } from '../types';
import { Modal } from '../components/ui/Modal';
import {
  Clock,
  BarChart3,
  Plus,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { TableLoader } from '../components/ui/LoadingSpinner';

export const TimeReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Time Log Modal (Manager only)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualUserId, setManualUserId] = useState('');
  const [manualHours, setManualHours] = useState('2');
  const [manualNote, setManualNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, u, myLogs] = await Promise.all([
        taskApi.getTasks(),
        userApi.getUsers(),
        timeApi.getMyLogs(),
      ]);
      setTasks(t);
      setUsers(u);
      setLogs(myLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timeApi.createManualLog({
        taskId: Number(manualTaskId),
        userId: Number(manualUserId),
        durationSeconds: Number(manualHours) * 3600,
        note: manualNote,
      });
      setIsManualModalOpen(false);
      setManualNote('');
      loadData();
      alert('Manual time adjustment saved with audit log record.');
    } catch (e) {
      console.error(e);
    }
  };

  const totalLoggedSeconds = tasks.reduce((sum, t) => sum + (t.totalLoggedSeconds || 0), 0);
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Time Tracking & Efficiency Analytics</h1>
          <p className="text-xs text-text-secondary mt-1">
            Server-side audited time logs, estimated vs actual variance, and employee velocity.
          </p>
        </div>

        {(user?.roleName === 'ROLE_ADMIN' || user?.roleName === 'ROLE_MANAGER') && (
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start"
          >
            <Plus className="w-4 h-4" /> Log Manual Time (Manager)
          </button>
        )}
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Total Actual Worked</span>
          <div className="text-3xl font-black text-primary mt-2">
            {(totalLoggedSeconds / 3600).toFixed(1)}h
          </div>
          <div className="text-xs text-text-secondary mt-1">Sum of verified sessions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Total Estimated Hours</span>
          <div className="text-3xl font-black text-text-primary mt-2">
            {totalEstimatedHours.toFixed(1)}h
          </div>
          <div className="text-xs text-text-secondary mt-1">Sprint planning estimate</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
          <span className="text-xs font-bold text-text-secondary uppercase">Sprint Variance</span>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {Math.abs(totalEstimatedHours - totalLoggedSeconds / 3600).toFixed(1)}h
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Within expected target</div>
        </div>
      </div>

      {/* Task-Level Estimated vs Actual Table */}
      <div className="bg-white rounded-2xl border border-border-custom shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-custom bg-purple-50/40 flex justify-between items-center">
          <h3 className="font-bold text-sm text-text-primary">Sprint Task Time Breakdown</h3>
          <span className="text-xs text-text-secondary">Sorted by Task Code</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50 text-text-secondary font-bold uppercase tracking-wider border-b border-border-custom">
              <tr>
                <th className="px-6 py-3.5">Task Code</th>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Assignee</th>
                <th className="px-6 py-3.5">Estimated</th>
                <th className="px-6 py-3.5">Actual Logged</th>
                <th className="px-6 py-3.5">Progress vs Estimate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {loading ? (
                <TableLoader colSpan={6} message="Loading time reports & sprint logs..." />
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    No tasks found to generate time breakdown.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const actualHours = (task.totalLoggedSeconds || 0) / 3600;
                  const est = Number(task.estimatedHours || 1);
                  const percent = Math.min(100, Math.round((actualHours / est) * 100));
                return (
                  <tr key={task.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary">{task.taskCode}</td>
                    <td className="px-6 py-4 font-semibold text-text-primary">{task.title}</td>
                    <td className="px-6 py-4 text-text-secondary">{task.assigneeName || 'Unassigned'}</td>
                    <td className="px-6 py-4 font-mono">{task.estimatedHours}h</td>
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {actualHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percent > 100 ? 'bg-rose-500' : 'bg-primary'
                              }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-text-secondary">
                          {percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL LOG MODAL */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Manual Time Adjustment (Manager Audited)"
      >
        <form onSubmit={handleCreateManualLog} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Select Task</label>
            <select
              required
              value={manualTaskId}
              onChange={(e) => setManualTaskId(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            >
              <option value="">-- Choose Task --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.taskCode}: {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Select Employee</label>
            <select
              required
              value={manualUserId}
              onChange={(e) => setManualUserId(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            >
              <option value="">-- Choose Employee --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.teamTag || u.roleName.replace('ROLE_', '')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Hours to Credit / Adjust</label>
            <input
              type="number"
              step="0.5"
              required
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Reason / Note (Required for Audit)</label>
            <textarea
              rows={3}
              required
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="e.g. Offline architecture workshop adjustment approved by Manager"
              className="w-full px-3 py-2 bg-purple-50 rounded-lg border border-border-custom outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-xs"
          >
            Save Audited Adjustment
          </button>
        </form>
      </Modal>
    </div>
  );
};
