import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { timeApi, notificationApi, taskApi, crmApi } from '../../services/api';
import { RunningTimer, NotificationItem, Task, Deal, Lead } from '../../types';
import {
  Search,
  Plus,
  Play,
  Square,
  Pause,
  Bell,
  Clock,
  LogOut,
  User as UserIcon,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Users,
} from 'lucide-react';

interface TopbarProps {
  onQuickAdd: () => void;
  onOpenTask: (taskId: number) => void;
  searchTerm: string;
  onSearchChange: (q: string) => void;
  onToggleMobileMenu?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onQuickAdd,
  onOpenTask,
  searchTerm,
  onSearchChange,
  onToggleMobileMenu,
  onNavigateTab,
}) => {
  const { user, logout } = useAuth();
  const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
  const [elapsedDisplay, setElapsedDisplay] = useState('00:00:00');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showTimerActions, setShowTimerActions] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Search Data Cache for instant live results
  const [tasksCache, setTasksCache] = useState<Task[]>([]);
  const [dealsCache, setDealsCache] = useState<Deal[]>([]);
  const [leadsCache, setLeadsCache] = useState<Lead[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (timerRef.current && !timerRef.current.contains(target)) {
        setShowTimerActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSearchIndex = async () => {
    try {
      const [tList, dList, lList] = await Promise.all([
        taskApi.getTasks().catch(() => []),
        crmApi.getDeals().catch(() => []),
        crmApi.getLeads().catch(() => []),
      ]);
      if (tList) setTasksCache(tList);
      if (dList) setDealsCache(dList);
      if (lList) setLeadsCache(lList);
    } catch (e) {}
  };

  // Poll server for active timer every 10s and on mount
  const fetchActiveTimer = async () => {
    try {
      const active = await timeApi.getActiveTimer();
      setRunningTimer(active);
    } catch (e) {
      // Ignore network errors on polling
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifs = await notificationApi.getMyNotifications();
      setNotifications(notifs);
    } catch (e) {}
  };

  useEffect(() => {
    fetchActiveTimer();
    fetchNotifications();
    const interval = setInterval(fetchActiveTimer, 10000);
    return () => clearInterval(interval);
  }, []);

  // Tick the live clock locally each second using the server start_time
  useEffect(() => {
    if (!runningTimer || !runningTimer.startTime) {
      setElapsedDisplay('00:00:00');
      return;
    }

    const startMs = new Date(runningTimer.startTime).getTime();

    const updateTick = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      setElapsedDisplay(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTick();
    const ticker = setInterval(updateTick, 1000);
    return () => clearInterval(ticker);
  }, [runningTimer]);

  const handleStopTimer = async () => {
    try {
      await timeApi.stopTimer();
      setRunningTimer(null);
      setShowTimerActions(false);
    } catch (e) {
      console.error('Failed to stop timer', e);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const query = searchTerm.trim().toLowerCase();
  const matchingTasks = query
    ? tasksCache.filter(
        (t) =>
          t.taskCode?.toLowerCase().includes(query) ||
          t.title?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          (t.assigneeNames || t.assigneeName || '')?.toLowerCase().includes(query) ||
          t.type?.toLowerCase().includes(query) ||
          t.priority?.toLowerCase().includes(query) ||
          t.status?.toLowerCase().includes(query)
      ).slice(0, 6)
    : [];

  const matchingDeals = query
    ? dealsCache.filter(
        (d) =>
          d.title?.toLowerCase().includes(query) ||
          d.customerName?.toLowerCase().includes(query) ||
          d.stage?.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingLeads = query
    ? leadsCache.filter(
        (l) =>
          l.firstName?.toLowerCase().includes(query) ||
          (l.lastName || '')?.toLowerCase().includes(query) ||
          (l.company || '')?.toLowerCase().includes(query) ||
          (l.email || '')?.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  return (
    <header className="h-16 bg-white border-b border-border-custom px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm gap-2 sm:gap-4">
      {/* Mobile Hamburger Button & Search Input */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xs sm:max-w-md">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-purple-50 rounded-xl transition-colors shrink-0"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div ref={searchRef} className="relative w-full">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks, leads, deals..."
            value={searchTerm}
            onFocus={() => {
              loadSearchIndex();
              if (searchTerm.trim().length > 0) setShowSearchDropdown(true);
            }}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSearchDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setShowSearchDropdown(false);
                if (onNavigateTab) onNavigateTab('tasks');
              } else if (e.key === 'Escape') {
                setShowSearchDropdown(false);
              }
            }}
            className="w-full pl-9 pr-8 py-2 bg-purple-50 hover:bg-purple-100/50 focus:bg-white text-xs sm:text-sm text-text-primary rounded-lg border border-transparent focus:border-primary outline-none transition-all placeholder:text-text-secondary"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Search Results Dropdown */}
          {showSearchDropdown && searchTerm.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-border-custom z-50 overflow-hidden max-h-96 flex flex-col animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 bg-purple-50/70 border-b border-border-custom flex items-center justify-between text-[11px] text-text-secondary font-semibold">
                <span>Search Results for "{searchTerm}"</span>
                <span className="text-[10px] text-primary bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                  {matchingTasks.length + matchingDeals.length + matchingLeads.length} found
                </span>
              </div>

              <div className="overflow-y-auto divide-y divide-gray-100 p-1 flex-1">
                {/* Matching Tasks */}
                {matchingTasks.length > 0 && (
                  <div className="py-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-purple-600" /> Tasks ({matchingTasks.length})
                    </div>
                    {matchingTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onOpenTask(t.id);
                          setShowSearchDropdown(false);
                        }}
                        className="px-2.5 py-2 hover:bg-purple-50/80 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-primary bg-purple-100 px-1.5 py-0.5 rounded">
                              {t.taskCode}
                            </span>
                            <span className="text-xs font-semibold text-text-primary truncate">
                              {t.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-text-secondary mt-0.5 flex items-center gap-2">
                            <span>Status: {t.status}</span>
                            <span>•</span>
                            <span>Priority: {t.priority}</span>
                            {t.assigneeName && (
                              <>
                                <span>•</span>
                                <span>👤 {t.assigneeName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching Deals */}
                {matchingDeals.length > 0 && (
                  <div className="py-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-emerald-600" /> Deals ({matchingDeals.length})
                    </div>
                    {matchingDeals.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('crm');
                          setShowSearchDropdown(false);
                        }}
                        className="px-2.5 py-2 hover:bg-purple-50/80 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-text-primary truncate">
                            {d.title}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            ${d.dealValue?.toLocaleString()} • Stage: {d.stage}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Matching Leads */}
                {matchingLeads.length > 0 && (
                  <div className="py-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-blue-600" /> Leads ({matchingLeads.length})
                    </div>
                    {matchingLeads.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab('crm');
                          setShowSearchDropdown(false);
                        }}
                        className="px-2.5 py-2 hover:bg-purple-50/80 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-text-primary truncate">
                            {l.firstName} {l.lastName || ''} {l.company ? `(${l.company})` : ''}
                          </div>
                          <div className="text-[11px] text-text-secondary">
                            {l.email || 'No email'} • Status: {l.status}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* No items found */}
                {matchingTasks.length === 0 && matchingDeals.length === 0 && matchingLeads.length === 0 && (
                  <div className="p-4 text-center text-xs text-text-secondary">
                    No tasks, leads, or deals found matching "<strong className="text-text-primary">{searchTerm}</strong>"
                  </div>
                )}
              </div>

              {/* Bottom footer bar */}
              <div className="p-2 bg-gray-50 border-t border-border-custom flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('tasks');
                    setShowSearchDropdown(false);
                  }}
                  className="w-full py-1.5 px-3 text-xs font-semibold text-primary hover:bg-purple-100 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Filter in Tasks Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Add Button */}
        <button
          onClick={onQuickAdd}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-primary text-sm font-semibold rounded-lg transition-colors"
          title="Quick Create Task"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create</span>
        </button>

        {/* Live Running Timer Chip (Top Priority USP) */}
        {runningTimer ? (
          <div ref={timerRef} className="relative">
            <div
              onClick={() => setShowTimerActions(!showTimerActions)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 bg-purple-50 border border-purple-200 text-primary rounded-full cursor-pointer hover:bg-purple-100 transition-all running-timer-pulse select-none"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-accent-pink animate-ping" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent-pink absolute left-3.5" />
              <span className="font-semibold text-xs tracking-wider uppercase ml-1">
                {runningTimer.taskCode}
              </span>
              <span className="font-mono font-bold text-sm text-text-primary">
                {elapsedDisplay}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
            </div>

            {/* Timer Actions Dropdown */}
            {showTimerActions && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-modal border border-border-custom p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="text-xs font-semibold text-text-secondary mb-1">RUNNING TASK</div>
                <div className="font-medium text-sm text-text-primary truncate mb-2">
                  {runningTimer.taskTitle}
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary py-1.5 border-t border-border-custom mb-3">
                  <span>Current Session:</span>
                  <span className="font-mono font-semibold text-primary">{elapsedDisplay}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onOpenTask(runningTimer.taskId);
                      setShowTimerActions(false);
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-purple-50 text-primary hover:bg-purple-100 text-xs font-medium rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Task
                  </button>
                  <button
                    onClick={handleStopTimer}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold rounded-lg"
                  >
                    <Square className="w-3.5 h-3.5" /> Pause Timer
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-full text-xs text-text-secondary">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>No Active Timer</span>
          </div>
        )}

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="p-2 text-text-secondary hover:text-primary hover:bg-purple-50 rounded-lg relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-border-custom z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border-custom flex items-center justify-between bg-purple-50/50">
                <span className="font-semibold text-sm text-text-primary">Notifications</span>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border-custom">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-secondary">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs hover:bg-purple-50 transition-colors ${
                        !n.isRead ? 'bg-pink-50/40' : ''
                      }`}
                    >
                      <div className="font-semibold text-text-primary mb-0.5">{n.title}</div>
                      <div className="text-text-secondary line-clamp-2">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-purple-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-200 to-pink-200 text-primary font-bold text-xs flex items-center justify-center border border-purple-200">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-text-primary leading-tight">
                {user?.fullName || 'User'}
              </div>
              <div className="text-[10px] text-text-secondary">
                {user?.teamTag || (user?.roleName || (user as any)?.role || 'ADMIN').replace('ROLE_', '')}
              </div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-modal border border-border-custom p-2 z-50">
              <div className="px-3 py-2 border-b border-border-custom mb-1">
                <div className="font-semibold text-xs text-text-primary">{user?.fullName}</div>
                <div className="text-[11px] text-text-secondary truncate">{user?.email}</div>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-purple-100 text-primary rounded-full uppercase">
                  {(user?.roleName || (user as any)?.role || 'ROLE_ADMIN').replace('ROLE_', '')}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
