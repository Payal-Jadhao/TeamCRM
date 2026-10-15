import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Users2,
  Calendar,
  FileCode,
  BarChart3,
  ShieldCheck,
  History,
  Sparkles,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'tasks'
  | 'crm'
  | 'api-handoff'
  | 'meetings'
  | 'reports'
  | 'users'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isCollapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, hasPermission, hasRole } = useAuth();

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    requiresAdminOrManager?: boolean;
    requiresAdminOnly?: boolean;
    badge?: string;
  }[] = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'crm', label: 'Clients & Deals', icon: Briefcase },
      { id: 'api-handoff', label: 'API Specs', icon: FileCode },
      { id: 'meetings', label: 'Meetings', icon: Calendar },
      { id: 'reports', label: 'Work Hours & Reports', icon: BarChart3, permission: 'REPORT_VIEW' },
      {
        id: 'users',
        label: 'Team & Permissions',
        icon: ShieldCheck,
        requiresAdminOrManager: true,
      },
      {
        id: 'audit',
        label: 'Activity Log',
        icon: History,
        requiresAdminOnly: true,
      },
    ];

  const visibleItems = navItems.filter((item) => {
    // Audit only for Admin
    if (item.requiresAdminOnly) {
      return user?.roleName === 'ROLE_ADMIN';
    }
    // Team & Permissions only for Admin and Manager (NEVER for employees)
    if (item.requiresAdminOrManager) {
      return user?.roleName === 'ROLE_ADMIN' || user?.roleName === 'ROLE_MANAGER';
    }
    if (user?.roleName === 'ROLE_ADMIN') return true;
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  const handleItemClick = (id: NavTab) => {
    onTabChange(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (isMobileView: boolean) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-custom/80 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm font-bold text-base">
              T
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-text-primary flex items-center gap-1.5">
                TeamCRM
              </div>
              <div className="text-[11px] text-text-secondary leading-none">Internal Platform</div>
            </div>
          </div>
          {isMobileView && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isActive
                    ? 'bg-purple-100/90 text-primary font-semibold shadow-xs'
                    : 'text-text-secondary hover:bg-white hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-primary' : 'text-text-secondary'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-pink text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Gemini AI Indicator */}
      <div className="p-4 m-3 bg-white rounded-xl border border-border-custom shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-bold text-xs text-text-primary">Gemini AI Copilot</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Smart checklist generation, auto lead insights & meeting action extraction.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 bg-purple-50 border-r border-border-custom flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
        {navContent(false)}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-purple-50 border-r border-border-custom shadow-2xl flex flex-col justify-between h-full select-none z-10 animate-in slide-in-from-left duration-200">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
