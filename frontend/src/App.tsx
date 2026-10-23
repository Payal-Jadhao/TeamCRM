import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Topbar } from './components/layout/Topbar';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { CrmPage } from './pages/CrmPage';
import { ApiHandoffPage } from './pages/ApiHandoffPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { TimeReportsPage } from './pages/TimeReportsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AiCopilotWidget } from './components/ai/AiCopilotWidget';
import type { Task } from './types';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected task to open in drawer
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Selected task to schedule meeting for
  const [taskForMeeting, setTaskForMeeting] = useState<Task | null>(null);

  if (!user) {
    return <LoginPage />;
  }

  const handleOpenTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    setActiveTab('tasks');
  };

  const handleScheduleMeetingFromTask = (task: Task) => {
    setTaskForMeeting(task);
    setActiveTab('meetings');
  };

  return (
    <div className="flex h-screen bg-bg-app overflow-hidden relative">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          onQuickAdd={() => {
            setActiveTab('tasks');
          }}
          onOpenTask={handleOpenTask}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenTask={handleOpenTask}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksPage
              onScheduleMeeting={handleScheduleMeetingFromTask}
              selectedTaskId={selectedTaskId}
              onClearSelectedTask={() => setSelectedTaskId(null)}
              searchTerm={searchTerm}
              onClearSearch={() => setSearchTerm('')}
            />
          )}

          {activeTab === 'crm' && <CrmPage searchTerm={searchTerm} />}

          {activeTab === 'api-handoff' && <ApiHandoffPage />}

          {activeTab === 'meetings' && (
            <MeetingsPage
              initialTaskForMeeting={taskForMeeting}
              onClearInitialTask={() => setTaskForMeeting(null)}
            />
          )}

          {activeTab === 'reports' && <TimeReportsPage />}

          {activeTab === 'users' && (user?.roleName === 'ROLE_ADMIN' || user?.roleName === 'ROLE_MANAGER') && <UsersPage />}

          {activeTab === 'audit' && user?.roleName === 'ROLE_ADMIN' && <AuditLogPage />}
        </main>
      </div>

      {/* Floating Gemini AI Copilot */}
      <AiCopilotWidget />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
