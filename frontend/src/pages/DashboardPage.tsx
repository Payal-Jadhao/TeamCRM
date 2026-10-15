import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, timeApi } from '../services/api';
import { ManagerDashboard, EmployeeDashboard, Task } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Play,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardPageProps {
  onOpenTask: (taskId: number) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenTask, onNavigateTab }) => {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.roleName === 'ROLE_ADMIN' || user?.roleName === 'ROLE_MANAGER';
  const [viewMode, setViewMode] = useState<'manager' | 'employee'>(
    isManagerOrAdmin ? 'manager' : 'employee'
  );

  const [managerData, setManagerData] = useState<ManagerDashboard | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [viewMode]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      if (viewMode === 'manager') {
        const data = await dashboardApi.getManagerDashboard();
        setManagerData(data);
      } else {
        const data = await dashboardApi.getEmployeeDashboard();
        setEmployeeData(data);
      }
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (seconds?: number) => {
    if (!seconds) return '0.0h';
    return (seconds / 3600).toFixed(1) + 'h';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header with Perspective Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Welcome back, {user?.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {viewMode === 'manager'
              ? 'Real-time team workload, revenue pipeline and sprint bottlenecks.'
              : 'Your active tasks, logged hours and upcoming meetings.'}
          </p>
        </div>

        {/* View Switcher if Admin/Manager */}
        {isManagerOrAdmin && (
          <div className="flex items-center bg-purple-50 p-1 rounded-xl border border-purple-200/80 self-start">
            <button
              onClick={() => setViewMode('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'manager'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Manager View
            </button>
            <button
              onClick={() => setViewMode('employee')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'employee'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              My Work View
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-text-secondary">
          Loading dashboard metrics...
        </div>
      ) : viewMode === 'manager' && managerData ? (
        /* MANAGER DASHBOARD */
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">PIPELINE REVENUE</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-text-primary mt-2">
                ${managerData.totalPipelineRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{managerData.wonDealsCount} deals closed won</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">ACTIVE SPRINT TASKS</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-text-primary mt-2">
                {managerData.inProgressTasks} / {managerData.totalTasks}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                In progress across all projects
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">BLOCKERS & QUERIES</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-text-primary mt-2">
                {managerData.blockedTasks} Blocked
              </div>
              <div className="text-xs text-rose-600 mt-1 font-medium">
                {managerData.openQueries} unresolved query threads
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">TOTAL CRM LEADS</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-primary flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-text-primary mt-2">
                {managerData.totalLeads}
              </div>
              <div className="text-xs text-primary mt-1 font-medium cursor-pointer hover:underline" onClick={() => onNavigateTab('crm')}>
                View sales funnel &rarr;
              </div>
            </div>
          </div>

          {/* Grid: Team Workload & Deals by Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Workload */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-text-primary">Team Workload Distribution</h3>
                <span className="text-xs text-text-secondary">Assigned Tasks</span>
              </div>
              <div className="space-y-4">
                {managerData.teamWorkload.map((member, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold text-text-primary mb-1">
                      <span>{member.name}</span>
                      <span className="text-primary">{member.tasks} tasks</span>
                    </div>
                    <div className="w-full h-2.5 bg-purple-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent-pink rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (member.tasks / Math.max(1, managerData.totalTasks)) * 200)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deals by Stage */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-text-primary">Deals by Pipeline Stage</h3>
                <button
                  onClick={() => onNavigateTab('crm')}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  View Kanban <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {managerData.dealsByStage.map((stage, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-text-secondary uppercase">
                      {stage.stage}
                    </span>
                    <span className="text-xl font-extrabold text-primary mt-2">
                      {stage.count} <span className="text-xs font-normal text-text-secondary">deals</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent System Activity / Audit */}
          <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-text-primary">Real-Time Audit Trail</h3>
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                View Full Audit Logs &rarr;
              </button>
            </div>
            <div className="divide-y divide-border-custom text-xs">
              {managerData.recentActivity.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-primary font-bold text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-text-primary font-medium">{log.newValue || log.entityName}</span>
                  </div>
                  <div className="text-text-secondary shrink-0">
                    {log.actorEmail || 'System'} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : employeeData ? (
        /* EMPLOYEE WORK DASHBOARD */
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-xs font-semibold text-text-secondary">MY PENDING TASKS</span>
              <div className="text-3xl font-black text-primary mt-2">
                {employeeData.myPendingTasksCount}
              </div>
              <div className="text-xs text-text-secondary mt-1">Assigned to you</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-xs font-semibold text-text-secondary">HOURS LOGGED (SERVER)</span>
              <div className="text-3xl font-black text-emerald-600 mt-2">
                {formatHours(employeeData.myTotalHoursLoggedSeconds)}
              </div>
              <div className="text-xs text-text-secondary mt-1">Verified work sessions</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-xs font-semibold text-text-secondary">COMPLETED SPRINT TASKS</span>
              <div className="text-3xl font-black text-text-primary mt-2">
                {employeeData.myDoneTasksCount}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-1">Great job! 🎉</div>
            </div>
          </div>

          {/* Running Timer Banner if Active */}
          {employeeData.activeTimer && (
            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                  <Play className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-accent-pink uppercase tracking-wider">
                    CURRENTLY LOGGING TIME
                  </div>
                  <div className="font-bold text-sm text-text-primary">
                    {employeeData.activeTimer.taskCode} - {employeeData.activeTimer.taskTitle}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenTask(employeeData.activeTimer!.taskId)}
                className="px-4 py-2 bg-white hover:bg-purple-50 text-primary font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Open Task View
              </button>
            </div>
          )}

          {/* Grid: My Tasks & Upcoming Meetings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Active Tasks List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-text-primary">My Active Tasks</h3>
                <button
                  onClick={() => onNavigateTab('tasks')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View Kanban Board &rarr;
                </button>
              </div>

              <div className="divide-y divide-border-custom">
                {employeeData.myActiveTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-secondary">
                    No active tasks assigned!
                  </div>
                ) : (
                  employeeData.myActiveTasks.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                      className="py-3 flex items-center justify-between hover:bg-purple-50/50 p-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-primary">{t.taskCode}</span>
                          <PriorityBadge priority={t.priority} />
                          <StatusBadge status={t.status} />
                        </div>
                        <div className="text-sm font-semibold text-text-primary line-clamp-1">
                          {t.title}
                        </div>
                      </div>
                      <div className="text-right text-xs text-text-secondary shrink-0">
                        {t.dueDate ? `Due ${t.dueDate}` : 'No due date'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Meetings */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-text-primary">Upcoming Meetings</h3>
                <button
                  onClick={() => onNavigateTab('meetings')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Calendar &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {employeeData.upcomingMeetings.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-secondary">
                    No meetings scheduled today.
                  </div>
                ) : (
                  employeeData.upcomingMeetings.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl"
                    >
                      <div className="font-bold text-xs text-text-primary line-clamp-1">{m.title}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-text-secondary mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({m.durationMinutes}m)
                        </span>
                      </div>
                      {m.meetingLink && (
                        <a
                          href={m.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-[11px] font-bold text-primary hover:underline"
                        >
                          Join Meeting &rarr;
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
