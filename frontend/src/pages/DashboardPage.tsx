import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import type { AdminDashboard, ManagerDashboard, EmployeeDashboard } from '../types';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  Briefcase,
  Lock,
  MessageSquare,
  AlertCircle,
  Video,
  UserCheck
} from 'lucide-react';
import { PageLoader } from '../components/ui/LoadingSpinner';

interface DashboardPageProps {
  onOpenTask: (taskId: number) => void;
  onNavigateTab: (tab: any, projectId?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenTask, onNavigateTab }) => {
  const { user } = useAuth();
  const userRole = user?.roleName || 'ROLE_EMPLOYEE';

  const [adminData, setAdminData] = useState<AdminDashboard | null>(null);
  const [managerData, setManagerData] = useState<ManagerDashboard | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userRole]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (userRole === 'ROLE_ADMIN') {
        const aDash = await dashboardApi.getAdminDashboard();
        setAdminData(aDash);
      } else if (userRole === 'ROLE_MANAGER') {
        const mDash = await dashboardApi.getManagerDashboard();
        setManagerData(mDash);
      } else {
        const eDash = await dashboardApi.getEmployeeDashboard();
        setEmployeeData(eDash);
      }
    } catch (e) {
      console.error('Failed to load live dashboard metrics from database', e);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-7 animate-in fade-in duration-200">
      {/* Top Header - No perspective switcher; strictly shows the current authenticated role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Welcome back, {user?.fullName || 'User'} 👋
          </h1>
          <p className="text-xs font-medium text-text-secondary mt-1">
            {userRole === 'ROLE_ADMIN' && (
              <span>
                <strong className="text-primary font-bold">ADMIN CONSOLE</strong> · Live database health, pipeline revenue, security and team oversight.
              </span>
            )}
            {userRole === 'ROLE_MANAGER' && (
              <span>
                <strong className="text-primary font-bold">MANAGER WORKSPACE · @{user?.teamTag || 'MANAGEMENT'}</strong> · Team delivery, sprint blockers, approvals and logged hours.
              </span>
            )}
            {userRole === 'ROLE_EMPLOYEE' && (
              <span>
                <strong className="text-primary font-bold">EMPLOYEE DESK · @{user?.teamTag || 'FRONTEND'}</strong> · Your assigned tasks, live timers and scheduled meetings.
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <PageLoader message="Loading live operational metrics from database..." />
      ) : userRole === 'ROLE_ADMIN' ? (
        /* ========================================================
           1. LIVE ADMIN DASHBOARD (PostgreSQL Driven)
           ======================================================== */
        <div className="space-y-6">
          {/* Top 6 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">PIPELINE REVENUE</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                ${Number(adminData?.totalPipelineRevenue || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                <span>↗</span>
                <span>${Number(adminData?.closedWonMonth || 0).toLocaleString()} won</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">CLOSED-WON</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                ${Number(adminData?.closedWonMonth || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-text-secondary mt-1">Live CRM closed deals</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">ACTIVE SPRINT TASKS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {adminData?.activeSprintTasks ?? 0} / {adminData?.totalSprintTasks ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary mt-1">In progress across database</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">BLOCKERS & QUERIES</span>
              <div className="text-2xl font-black text-rose-600 mt-2">
                {adminData?.blockedTasks ?? 0} Blocked
              </div>
              <div className="text-[11px] text-rose-500 mt-1 font-medium">Attention needed</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">TOTAL CRM LEADS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {adminData?.totalLeads ?? 0}
              </div>
              <div
                onClick={() => onNavigateTab('crm')}
                className="text-[11px] text-primary mt-1 font-bold cursor-pointer hover:underline"
              >
                View sales funnel &rarr;
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">ACTIVE USERS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {adminData?.activeUsersCount ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary mt-1">
                {adminData?.adminCount ?? 0} Admin · {adminData?.managerCount ?? 0} Mgr · {adminData?.employeeCount ?? 0} Emp
              </div>
            </div>
          </div>

          {/* 2-Column Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget 1: Team Workload */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-text-primary">Team Workload</h3>
                <span className="text-xs text-text-secondary font-medium">All active employees</span>
              </div>
              <div className="space-y-4">
                {(adminData?.teamWorkload && adminData.teamWorkload.length > 0) ? (
                  adminData.teamWorkload.map((w, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold text-text-primary mb-1.5">
                        <span>{w.name}</span>
                        <span className="text-text-secondary">{w.tasks} tasks</span>
                      </div>
                      <div className="w-full h-2.5 bg-purple-100/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                          style={{ width: `${Math.min(100, (Number(w.tasks) / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-text-secondary text-center py-4">No task workload recorded yet.</div>
                )}
              </div>
            </div>

            {/* Widget 2: Deals by Stage */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-text-primary">Deals by Stage</h3>
                <button
                  onClick={() => onNavigateTab('crm')}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Pipeline &rarr;
                </button>
              </div>
              <div className="space-y-3">
                {(adminData?.dealsByStage && adminData.dealsByStage.length > 0) ? (
                  adminData.dealsByStage.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 text-xs">
                      <span className="font-semibold text-text-primary capitalize">{d.stage?.toLowerCase()}</span>
                      <span className="font-extrabold text-primary bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                        {d.count} deal{Number(d.count) === 1 ? '' : 's'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-text-secondary text-center py-4">No deals found in pipeline.</div>
                )}
              </div>
            </div>

            {/* Widget 3: Sprint Variance */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-text-primary">Sprint Variance</h3>
                <span className="text-xs text-text-secondary font-medium">Estimated vs Actual Hours</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-text-secondary">Estimated</span>
                  <span className="font-bold text-text-primary">{Number(adminData?.estimatedHours || 0).toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-text-secondary">Actual Logged</span>
                  <span className="font-bold text-text-primary">{Number(adminData?.actualHours || 0).toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between py-2 font-bold text-text-primary">
                  <span>Variance</span>
                  <span className="text-emerald-600 font-extrabold">{Number(adminData?.varianceHours || 0).toFixed(1)}h</span>
                </div>
              </div>
            </div>

            {/* Widget 4: Admin Security Oversight */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-text-primary">Security & Governance</h3>
                <span className="text-xs text-text-secondary font-medium">Live Server Metrics</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-text-primary">Active user accounts</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                    {adminData?.activeUsersCount ?? 0} active
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-text-primary">Active running timers</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-primary font-bold text-[11px]">
                    {adminData?.activeTimers ?? 0} online
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium text-text-primary">Overdue tasks</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">
                    {adminData?.overdueTasks ?? 0} overdue
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Widget: Real-Time Audit Trail */}
          <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-text-primary">Real-Time Audit Trail</h3>
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                View Full Audit Logs &rarr;
              </button>
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {(adminData?.recentActivity && adminData.recentActivity.length > 0) ? (
                adminData.recentActivity.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-primary font-bold text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-text-primary font-medium">{log.entityName}</span>
                      <span className="text-text-secondary text-[11px] hidden sm:inline">by {log.actorEmail}</span>
                    </div>
                    <span className="text-text-secondary text-[11px]">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-text-secondary py-3 text-center">No recent audit logs.</div>
              )}
            </div>
          </div>
        </div>
      ) : userRole === 'ROLE_MANAGER' ? (
        /* ========================================================
           2. LIVE MANAGER DASHBOARD (PostgreSQL Driven)
           ======================================================== */
        <div className="space-y-6">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">TEAM ACTIVE TASKS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {managerData?.inProgressTasks ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary mt-1">Across managed projects</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">TOTAL SPRINT TASKS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {managerData?.totalTasks ?? 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Total items</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">BLOCKERS & ISSUES</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {managerData?.blockedTasks ?? 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                {Number(managerData?.blockedTasks || 0) === 0 ? 'All clear' : 'Action needed'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">MANAGED PROJECTS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {managerData?.totalProjects ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary mt-1">Active projects</div>
            </div>
          </div>

          {/* Manager Grid */}
          <div className="grid grid-cols-1 gap-6">
            {/* Team Workload */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-text-primary">Team Workload</h3>
                <span className="text-xs text-text-secondary font-medium">Assigned contributors</span>
              </div>
              <div className="space-y-4">
                {(managerData?.teamWorkload && managerData.teamWorkload.length > 0) ? (
                  managerData.teamWorkload.map((w, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold text-text-primary mb-1.5">
                        <span>{w.name}</span>
                        <span className="text-text-secondary font-medium">{w.tasks} tasks</span>
                      </div>
                      <div className="w-full h-2.5 bg-purple-100/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                          style={{ width: `${Math.min(100, (Number(w.tasks) / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-text-secondary py-4 text-center">No team tasks assigned yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Security Notice (100% English) */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-center gap-2.5">
            <Lock className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              <strong>Restricted Access:</strong> Client accounts, financial deals, revenue figures, passwords, and executive permissions are restricted for Manager role.
            </span>
          </div>
        </div>
      ) : (
        /* ========================================================
           3. LIVE EMPLOYEE DASHBOARD (PostgreSQL Driven)
           ======================================================== */
        <div className="space-y-6">
          {/* Active Timer Banner */}
          <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">ACTIVE TIMER</span>
            <div className="text-3xl font-mono font-black text-text-primary mt-1">
              {employeeData?.activeTimer ? (
                <span className="text-emerald-600 flex items-center gap-2">
                  <Play className="w-6 h-6 animate-pulse" />
                  Running ({employeeData.activeTimer.taskCode || 'Task'})
                </span>
              ) : (
                '00:00:00'
              )}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {employeeData?.activeTimer ? 'Server-side timer is active' : 'No active task running'}
            </div>
          </div>

          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">MY PENDING TASKS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {employeeData?.myPendingTasksCount ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary mt-1">Assigned to me</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">COMPLETED TASKS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {employeeData?.myDoneTasksCount ?? 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Marked Done</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">MY HOURS LOGGED</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {formatHours(employeeData?.myTotalHoursLoggedSeconds ?? 0)}h
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Logged by server timer</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-border-custom shadow-xs">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">UNREAD NOTIFICATIONS</span>
              <div className="text-2xl font-black text-text-primary mt-2">
                {employeeData?.unreadNotificationsCount ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary mt-1">Inbox alerts</div>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Active Tasks from DB */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-text-primary">My Assigned Tasks</h3>
                <span className="text-xs text-text-secondary font-medium">From database</span>
              </div>
              <div className="space-y-3">
                {(employeeData?.myActiveTasks && employeeData.myActiveTasks.length > 0) ? (
                  employeeData.myActiveTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-purple-50/40 border border-purple-100 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-primary">{t.taskCode}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                            t.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-text-primary">{t.title}</p>
                      </div>
                      <button
                        onClick={() => onOpenTask(t.id)}
                        className="px-3.5 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow-2xs hover:bg-primary-hover cursor-pointer"
                      >
                        Open
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-text-secondary py-4 text-center">No assigned tasks right now.</div>
                )}
              </div>
            </div>

            {/* Upcoming Meetings from DB */}
            <div className="bg-white p-6 rounded-2xl border border-border-custom shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-text-primary">Upcoming Meetings</h3>
              </div>
              <div className="space-y-2.5">
                {(employeeData?.upcomingMeetings && employeeData.upcomingMeetings.length > 0) ? (
                  employeeData.upcomingMeetings.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <span className="font-semibold text-text-primary block">{m.title}</span>
                          <span className="text-[11px] text-text-secondary">
                            {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigateTab('meetings')}
                        className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow-2xs hover:bg-primary-hover cursor-pointer"
                      >
                        Join
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-text-secondary py-4 text-center">No meetings scheduled today.</div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Security Notice (100% English) */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-center gap-2.5">
            <Lock className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              <strong>Restricted Access:</strong> Revenue, financial deals, peer workloads/hours, team administration, and system audit logs are restricted for Employee role.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
