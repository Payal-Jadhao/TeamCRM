import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskApi, timeApi, discussionApi, apiHandoffApi, aiApi, userApi } from '../services/api';
import type {
  Task,
  ChecklistItem,
  TimeLog,
  TaskComment,
  ApiDoc,
  User,
  TaskStatus,
} from '../types';
import { StatusBadge, PriorityBadge, TeamTagChip } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Plus,
  Play,
  Square,
  Pause,
  Clock,
  CheckSquare,
  MessageSquare,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Filter,
  User as UserIcon,
  Send,
  Code,
  FileCode,
  AlertCircle,
  HelpCircle,
  Edit3,
  Trash2,
  Users,
} from 'lucide-react';

interface TasksPageProps {
  onScheduleMeeting: (task: Task) => void;
  selectedTaskId?: number | null;
  onClearSelectedTask?: () => void;
  searchTerm?: string;
  onClearSearch?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onScheduleMeeting,
  selectedTaskId,
  onClearSelectedTask,
  searchTerm,
  onClearSearch,
}) => {
  const { user, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Task Drawer / Details Modal State
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [drawerTab, setDrawerTab] = useState<'timetrack' | 'checklist' | 'discussions' | 'api'>('timetrack');

  // Drawer Sub-data
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [isTaskTimerRunning, setIsTaskTimerRunning] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentType, setCommentType] = useState<'GENERAL' | 'QUERY' | 'BLOCKER'>('GENERAL');
  const [commentBody, setCommentBody] = useState('');
  const [taskApiDocs, setTaskApiDocs] = useState<ApiDoc[]>([]);

  // AI loading state
  const [aiLoading, setAiLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Create Task Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState('FEATURE');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskIsAllEmployees, setNewTaskIsAllEmployees] = useState(false);
  const [newTaskSelectedAssignees, setNewTaskSelectedAssignees] = useState<number[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskEstHours, setNewTaskEstHours] = useState('8');
  const [newTaskChecklistEnforced, setNewTaskChecklistEnforced] = useState(true);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Edit Task Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editTaskCode, setEditTaskCode] = useState<string>('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('FEATURE');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editIsAllEmployees, setEditIsAllEmployees] = useState(false);
  const [editSelectedAssignees, setEditSelectedAssignees] = useState<number[]>([]);
  const [editDueDate, setEditDueDate] = useState('');
  const [editEstHours, setEditEstHours] = useState('8');
  const [editChecklistEnforced, setEditChecklistEnforced] = useState(true);

  // Permissions: Employee CANNOT edit or delete tasks
  const isAdminOrManager = user?.roleName === 'ROLE_ADMIN' || user?.roleName === 'ROLE_MANAGER';
  const canEditTask = isAdminOrManager;
  const canDeleteTask = isAdminOrManager;
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Role-based assignee grouping:
  // Admin can assign to: Managers and Employees (all users)
  // Manager can assign to: Employees (and other managers)
  const assignableUsers = users.filter((u) => {
    if (user?.roleName === 'ROLE_ADMIN') return true;
    if (user?.roleName === 'ROLE_MANAGER') {
      return u.roleName === 'ROLE_EMPLOYEE' || u.roleName === 'ROLE_MANAGER';
    }
    return true;
  });
  const managersList = assignableUsers.filter((u) => u.roleName === 'ROLE_MANAGER');
  const employeesList = assignableUsers.filter((u) => u.roleName === 'ROLE_EMPLOYEE' || u.roleName === 'ROLE_ADMIN');

  const openEditModal = (t: Task) => {
    setActiveTask(t);
    setEditTaskId(t.id);
    setEditTaskCode(t.taskCode);
    setEditTitle(t.title);
    setEditDesc(t.description || '');
    setEditType(t.type);
    setEditPriority(t.priority);

    if (t.assigneeIds === 'ALL' || t.assigneeNames === 'All Employees') {
      setEditIsAllEmployees(true);
      setEditSelectedAssignees([]);
    } else if (t.assigneeIds) {
      setEditIsAllEmployees(false);
      const ids = t.assigneeIds
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((n) => !isNaN(n) && n > 0);
      setEditSelectedAssignees(ids);
    } else if (t.assigneeId) {
      setEditIsAllEmployees(false);
      setEditSelectedAssignees([t.assigneeId]);
    } else {
      setEditIsAllEmployees(false);
      setEditSelectedAssignees([]);
    }

    setEditDueDate(t.dueDate || '');
    setEditEstHours(t.estimatedHours ? String(t.estimatedHours) : '8');
    setEditChecklistEnforced(t.checklistMustBeCompleted);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = editTaskId || activeTask?.id;
    if (!targetId) return;
    try {
      let assigneeIdsParam: string | undefined = undefined;
      let primaryAssigneeId: number | undefined = undefined;

      if (editIsAllEmployees) {
        assigneeIdsParam = 'ALL';
      } else if (editSelectedAssignees.length > 0) {
        assigneeIdsParam = editSelectedAssignees.join(',');
        primaryAssigneeId = editSelectedAssignees[0];
      } else {
        assigneeIdsParam = '';
      }

      const updated = await taskApi.updateTask(targetId, {
        title: editTitle,
        description: editDesc,
        type: editType,
        priority: editPriority,
        assigneeId: primaryAssigneeId,
        assigneeIds: assigneeIdsParam,
        dueDate: editDueDate || undefined,
        estimatedHours: editEstHours ? Number(editEstHours) : undefined,
        checklistMustBeCompleted: editChecklistEnforced,
      });
      if (activeTask && activeTask.id === targetId) {
        setActiveTask(updated);
      }
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setIsEditModalOpen(false);
      showToast(`Task ${updated.taskCode} updated successfully!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (activeTask && activeTask.id === taskId) {
        setActiveTask(null);
      }
      showToast('Task deleted successfully and logged to audit trail.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete task', 'error');
    }
  };

  // Workflow Handlers:
  // 1. To Do -> In Progress & Start Timer
  const handleStartWork = async (taskId: number) => {
    try {
      try { await timeApi.startTimer(taskId, 'Sprint execution'); } catch {}
      const updated = await taskApi.updateStatus(taskId, 'IN_PROGRESS');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...updated, isTimerRunning: true } : t)));
      if (activeTask && activeTask.id === taskId) {
        setActiveTask({ ...updated, isTimerRunning: true });
        setIsTaskTimerRunning(true);
      }
      showToast('Timer started! Task moved to In Progress.', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to start work', 'error');
    }
  };

  // 2. Pause Timer (stays in In Progress)
  const handlePauseWork = async (taskId: number) => {
    try {
      await timeApi.stopTimer('Session paused');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, isTimerRunning: false } : t)));
      if (activeTask && activeTask.id === taskId) {
        setActiveTask((prev) => prev ? { ...prev, isTimerRunning: false } : null);
        setIsTaskTimerRunning(false);
      }
      showToast('Timer paused. Task remains In Progress.', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to pause timer', 'error');
    }
  };

  // 3. In Progress -> Review (Stops timer & submits for review)
  const handleSubmitForReview = async (taskId: number) => {
    try {
      try { await timeApi.stopTimer('Submitted for review'); } catch {}
      const updated = await taskApi.updateStatus(taskId, 'REVIEW');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...updated, isTimerRunning: false } : t)));
      if (activeTask && activeTask.id === taskId) {
        setActiveTask({ ...updated, isTimerRunning: false });
        setIsTaskTimerRunning(false);
      }
      showToast('Task submitted for Review by Admin/Manager!', 'success');
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to submit task for review';
      setStatusError(msg);
      showToast(msg, 'error');
    }
  };

  // 4. Review -> Done (Only for Admin/Manager approval)
  const handleApproveTask = async (taskId: number) => {
    try {
      const updated = await taskApi.updateStatus(taskId, 'DONE');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (activeTask && activeTask.id === taskId) {
        setActiveTask(updated);
      }
      showToast(`Task ${updated.taskCode} approved and moved to Done!`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Cannot complete task';
      setStatusError(msg);
      showToast(msg, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      loadTaskDetails(selectedTaskId);
    }
  }, [selectedTaskId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTasks, allUsers] = await Promise.all([
        taskApi.getTasks(),
        userApi.getUsers(),
      ]);
      setTasks(allTasks);
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (taskId: number) => {
    try {
      const [t, chk, logs, comms, docs] = await Promise.all([
        taskApi.getTaskById(taskId),
        taskApi.getChecklist(taskId),
        timeApi.getTaskLogs(taskId),
        discussionApi.getComments(taskId),
        apiHandoffApi.getByTaskId(taskId),
      ]);
      setActiveTask(t);
      setChecklist(chk);
      setTimeLogs(logs);
      setComments(comms);
      setTaskApiDocs(docs);

      const running = logs.some((l) => !l.endTime);
      setIsTaskTimerRunning(running);
    } catch (e) {
      console.error(e);
    }
  };

  // Status Change (with validation check for incomplete checklist on DONE)
  const handleMoveStatus = async (taskId: number, newStatus: string) => {
    setStatusError('');
    try {
      const updated = await taskApi.updateStatus(taskId, newStatus);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (activeTask && activeTask.id === taskId) {
        setActiveTask(updated);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Cannot change status';
      setStatusError(msg);
      alert(msg);
    }
  };

  // Time Tracking Controls
  const handleStartTimer = async (taskId: number) => {
    try {
      await timeApi.startTimer(taskId, 'Active sprint development');
      setIsTaskTimerRunning(true);
      loadTaskDetails(taskId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopTimer = async (taskId: number) => {
    try {
      await timeApi.stopTimer('Session paused');
      setIsTaskTimerRunning(false);
      loadTaskDetails(taskId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Checklist Actions
  const handleToggleChecklist = async (itemId: number) => {
    try {
      await taskApi.toggleChecklistItem(itemId);
      if (activeTask) {
        const chk = await taskApi.getChecklist(activeTask.id);
        setChecklist(chk);
        // refresh task to update progress counts
        const t = await taskApi.getTaskById(activeTask.id);
        setActiveTask(t);
        setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || !activeTask) return;
    try {
      await taskApi.addChecklistItem(activeTask.id, newChecklistText.trim());
      setNewChecklistText('');
      const chk = await taskApi.getChecklist(activeTask.id);
      setChecklist(chk);
    } catch (e) {
      console.error(e);
    }
  };

  // Gemini AI Checklist Generation
  const handleAiGenerateChecklist = async () => {
    if (!activeTask) return;
    setAiLoading(true);
    try {
      const promptContent = `${activeTask.title}: ${activeTask.description || ''}`;
      const res = await aiApi.generate('CHECKLIST', promptContent);
      if (res.items && res.items.length > 0) {
        for (const itemText of res.items) {
          await taskApi.addChecklistItem(activeTask.id, itemText);
        }
        const updatedChk = await taskApi.getChecklist(activeTask.id);
        setChecklist(updatedChk);
      }
    } catch (e) {
      console.error('AI generation failed', e);
    } finally {
      setAiLoading(false);
    }
  };

  // Discussion Post
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || !activeTask) return;
    try {
      const saved = await discussionApi.postComment(activeTask.id, commentBody.trim(), commentType);
      setComments((prev) => [...prev, saved]);
      setCommentBody('');
    } catch (e) {
      console.error(e);
    }
  };

  // Create Task Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let assigneeIdsParam: string | undefined = undefined;
      let primaryAssigneeId: number | undefined = undefined;

      if (newTaskIsAllEmployees) {
        assigneeIdsParam = 'ALL';
      } else if (newTaskSelectedAssignees.length > 0) {
        assigneeIdsParam = newTaskSelectedAssignees.join(',');
        primaryAssigneeId = newTaskSelectedAssignees[0];
      }

      const created = await taskApi.createTask({
        title: newTaskTitle,
        description: newTaskDesc,
        type: newTaskType,
        priority: newTaskPriority,
        assigneeId: primaryAssigneeId,
        assigneeIds: assigneeIdsParam,
        dueDate: newTaskDueDate || undefined,
        estimatedHours: newTaskEstHours ? Number(newTaskEstHours) : 8,
        checklistMustBeCompleted: newTaskChecklistEnforced,
      });
      setTasks((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskIsAllEmployees(false);
      setNewTaskSelectedAssignees([]);
      showToast(`Task ${created.taskCode} created successfully!`, 'success');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to create task', 'error');
    }
  };

  // Filter Tasks
  const isEmployee = user?.roleName === 'ROLE_EMPLOYEE';
  const myId = user?.id;

  const filteredTasks = tasks.filter((t) => {
    // If logged in as Employee, ONLY show tasks assigned to me or assigned to ALL
    if (isEmployee) {
      const isAssignedToAll = t.assigneeIds === 'ALL' || t.assigneeNames === 'All Employees';
      const isDirectAssignee = myId != null && t.assigneeId === myId;
      const isMultiAssignee =
        myId != null &&
        t.assigneeIds
          ?.split(',')
          .map((s) => s.trim())
          .includes(String(myId));

      if (!isAssignedToAll && !isDirectAssignee && !isMultiAssignee) {
        return false;
      }
    }

    if (filterAssignee !== 'ALL') {
      const matchesDirect = String(t.assigneeId) === filterAssignee;
      const matchesMulti = t.assigneeIds
        ?.split(',')
        .map((s) => s.trim())
        .includes(filterAssignee);
      const isAll = t.assigneeIds === 'ALL' || t.assigneeNames === 'All Employees';
      if (!matchesDirect && !matchesMulti && !isAll) return false;
    }
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (filterType !== 'ALL' && t.type !== filterType) return false;

    // Filter by Topbar search term across code, title, desc, assignee, type, priority, and status
    if (searchTerm && searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const codeMatch = t.taskCode?.toLowerCase().includes(q);
      const titleMatch = t.title?.toLowerCase().includes(q);
      const descMatch = t.description?.toLowerCase().includes(q);
      const assigneeMatch = (t.assigneeNames || t.assigneeName || '')?.toLowerCase().includes(q);
      const typeMatch = t.type?.toLowerCase().includes(q);
      const priorityMatch = t.priority?.toLowerCase().includes(q);
      const statusMatch = t.status?.toLowerCase().includes(q);
      if (!codeMatch && !titleMatch && !descMatch && !assigneeMatch && !typeMatch && !priorityMatch && !statusMatch) {
        return false;
      }
    }

    return true;
  });

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'TODO', label: 'To Do', color: 'bg-gray-100 text-gray-700' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { status: 'BLOCKED', label: 'Blocked', color: 'bg-rose-100 text-rose-700' },
    { status: 'REVIEW', label: 'Review', color: 'bg-amber-100 text-amber-700' },
    { status: 'DONE', label: 'Done', color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 relative">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-bold transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border-custom shadow-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mr-1">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filters:</span>
          </div>

          {user?.roleName === 'ROLE_EMPLOYEE' ? (
            /* For Employee: Show selected employee email badge */
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-purple-50 text-primary border border-purple-200 rounded-lg font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>👤 {user?.email}</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700">
                {user?.fullName} ({user?.teamTag || 'Backend'})
              </span>
            </div>
          ) : (
            /* For Admin and Manager: Show full filter selectors */
            <>
              {/* Assignee Filter */}
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-3 py-1.5 text-xs bg-purple-50 text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              >
                <option value="ALL">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.fullName} ({u.teamTag || u.roleName.replace('ROLE_', '')})
                  </option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 text-xs bg-purple-50 text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 text-xs bg-purple-50 text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="FEATURE">Feature</option>
                <option value="BUG">Bug</option>
                <option value="QUERY">Query</option>
                <option value="CHORE">Chore</option>
              </select>
            </>
          )}
        </div>

        {/* Create Task Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Active Search Filter Banner */}
      {searchTerm && searchTerm.trim() !== '' && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-secondary">Filtering Tasks:</span>
            <span className="font-bold text-primary bg-white px-2 py-0.5 rounded border border-purple-200 shadow-2xs">
              "{searchTerm}"
            </span>
            <span className="text-text-secondary">({filteredTasks.length} matching)</span>
          </div>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-rose-200"
            >
              Clear Search ×
            </button>
          )}
        </div>
      )}

      {statusError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusError}</span>
        </div>
      )}

      {/* Kanban Board Grid: Responsive Stacking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-purple-50/40 rounded-2xl border border-border-custom p-3 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border-custom mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-text-primary uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-primary font-bold text-[11px] flex items-center justify-center">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-purple-200/50 rounded-xl flex items-center justify-center text-[11px] text-text-secondary/70">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => loadTaskDetails(task.id)}
                      className={`bg-white p-3.5 rounded-xl border border-border-custom shadow-xs hover:shadow-soft transition-all cursor-pointer group ${
                        task.isTimerRunning ? 'ring-2 ring-primary/40 bg-purple-50/20' : ''
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {task.taskCode}
                        </span>
                        <div className="flex items-center gap-1">
                          {task.isTimerRunning && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-purple-100 px-1.5 py-0.5 rounded-full animate-pulse">
                              <Clock className="w-3 h-3" /> Live
                            </span>
                          )}
                          <PriorityBadge priority={task.priority} />
                          {canEditTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTask(task);
                                openEditModal(task);
                              }}
                              className="p-1 hover:bg-purple-100 text-text-secondary hover:text-primary rounded transition-colors"
                              title="Edit Task"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          {canDeleteTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskToDelete(task);
                              }}
                              className="p-1 hover:bg-rose-100 text-text-secondary hover:text-rose-600 rounded cursor-pointer transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-semibold text-xs text-text-primary line-clamp-2 leading-relaxed mb-3 group-hover:text-primary transition-colors">
                        {task.title}
                      </h4>

                      {/* Checklist & Timer Indicators */}
                      <div className="flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-border-custom/60">
                        <div className="flex items-center gap-3">
                          {task.checklistTotal > 0 && (
                            <span
                              className={`flex items-center gap-1 ${
                                task.checklistCompleted === task.checklistTotal
                                  ? 'text-emerald-600 font-semibold'
                                  : ''
                              }`}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {task.checklistCompleted}/{task.checklistTotal}
                            </span>
                          )}
                          {task.totalLoggedSeconds > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {(task.totalLoggedSeconds / 3600).toFixed(1)}h
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatar / Badge */}
                        {task.assigneeIds === 'ALL' || task.assigneeNames === 'All Employees' ? (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 font-bold text-[10px]"
                            title="Assigned to All Employees"
                          >
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>All Staff</span>
                          </span>
                        ) : task.assigneeNames && task.assigneeNames.includes(',') ? (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-primary font-bold text-[10px]"
                            title={task.assigneeNames}
                          >
                            <Users className="w-3 h-3" />
                            <span>{task.assigneeIds ? `${task.assigneeIds.split(',').length} Staff` : 'Team'}</span>
                          </span>
                        ) : task.assigneeName ? (
                          <div
                            className="w-6 h-6 rounded-full bg-purple-100 text-primary font-bold text-[10px] flex items-center justify-center border border-purple-200"
                            title={task.assigneeName}
                          >
                            {task.assigneeName.slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">Unassigned</span>
                        )}
                      </div>

                      {/* Action Strip: To Do -> In Progress -> Review -> Done */}
                      <div className="mt-2.5 pt-2 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-medium">Action:</span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {col.status === 'TODO' && (
                            <button
                              type="button"
                              onClick={() => handleStartWork(task.id)}
                              className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <Play className="w-3 h-3" /> Start Work
                            </button>
                          )}

                          {col.status === 'IN_PROGRESS' && (
                            <>
                              {task.isTimerRunning ? (
                                <button
                                  type="button"
                                  onClick={() => handlePauseWork(task.id)}
                                  className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  <Pause className="w-3 h-3" /> Pause
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartWork(task.id)}
                                  className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" /> Resume
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSubmitForReview(task.id)}
                                className="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-primary font-bold cursor-pointer transition-colors flex items-center gap-1"
                              >
                                Review
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try { await timeApi.stopTimer('Marked blocked'); } catch {}
                                  await handleMoveStatus(task.id, 'BLOCKED');
                                  showToast(`Task ${task.taskCode} marked Blocked`, 'error');
                                }}
                                className="px-1.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold cursor-pointer transition-colors"
                                title="Mark Blocked"
                              >
                                🚫
                              </button>
                            </>
                          )}

                          {col.status === 'BLOCKED' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartWork(task.id)}
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <Play className="w-3 h-3" /> Unblock
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStatus(task.id, 'TODO')}
                                className="px-1.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer transition-colors"
                                title="Send back to To Do"
                              >
                                To Do
                              </button>
                            </div>
                          )}

                          {col.status === 'REVIEW' && (
                            <>
                              {isAdminOrManager ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveTask(task.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                                  >
                                    ✓ Approve Done
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveStatus(task.id, 'IN_PROGRESS')}
                                    className="px-1.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer transition-colors"
                                    title="Send back to In Progress"
                                  >
                                    ↩ Back
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                  ⏳ Under Manager Review
                                </span>
                              )}
                            </>
                          )}

                          {col.status === 'DONE' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                ✓ Done
                              </span>
                              {isAdminOrManager && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStatus(task.id, 'TODO')}
                                  className="text-[9px] text-gray-400 hover:text-gray-700 underline cursor-pointer"
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK DETAIL DRAWER / MODAL */}
      {activeTask && (
        <Modal
          isOpen={!!activeTask}
          onClose={() => {
            setActiveTask(null);
            if (onClearSelectedTask) onClearSelectedTask();
          }}
          title={`${activeTask.taskCode}: ${activeTask.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-purple-50/70 rounded-xl border border-border-custom">
              <div className="flex items-center gap-2">
                <StatusBadge status={activeTask.status} />
                <PriorityBadge priority={activeTask.priority} />
                <span className="text-xs font-semibold px-2 py-0.5 bg-white text-text-secondary rounded-md border border-border-custom">
                  {activeTask.type}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div>
                  <span className="text-text-secondary">Assignee:</span>{' '}
                  <span className="font-semibold text-text-primary">
                    {activeTask.assigneeName || 'Unassigned'}
                  </span>
                </div>
                {activeTask.dueDate && (
                  <div>
                    <span className="text-text-secondary">Due:</span>{' '}
                    <span className="font-semibold text-text-primary">{activeTask.dueDate}</span>
                  </div>
                )}
                {canEditTask && (
                  <button
                    type="button"
                    onClick={() => openEditModal(activeTask)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-purple-100 text-primary font-bold text-xs rounded-lg border border-purple-200 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {canDeleteTask && (
                  <button
                    type="button"
                    onClick={() => setTaskToDelete(activeTask)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            {activeTask.description && (
              <div>
                <h5 className="text-xs font-bold text-text-secondary uppercase mb-1">Description</h5>
                <p className="text-sm text-text-primary leading-relaxed bg-white p-3 rounded-xl border border-border-custom">
                  {activeTask.description}
                </p>
              </div>
            )}

            {/* Linked CRM entity banner */}
            {(activeTask.linkedLeadName || activeTask.linkedCustomerName || activeTask.linkedDealTitle) && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-accent-pink font-semibold">
                  <LinkIcon className="w-4 h-4" />
                  <span>
                    Linked to CRM:{' '}
                    {activeTask.linkedDealTitle || activeTask.linkedCustomerName || activeTask.linkedLeadName}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-accent-pink bg-white px-2 py-0.5 rounded-full border border-pink-200">
                  CRM Synced
                </span>
              </div>
            )}

            {/* Tabs for Details: Time Tracking, Checklist, Discussions, API */}
            <div className="border-b border-border-custom flex gap-4 text-xs font-bold">
              <button
                onClick={() => setDrawerTab('timetrack')}
                className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                  drawerTab === 'timetrack'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time Tracking ({((activeTask.totalLoggedSeconds || 0) / 3600).toFixed(1)}h)</span>
              </button>

              <button
                onClick={() => setDrawerTab('checklist')}
                className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                  drawerTab === 'checklist'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Checklist ({checklist.filter((c) => c.isDone).length}/{checklist.length})</span>
              </button>

              <button
                onClick={() => setDrawerTab('discussions')}
                className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                  drawerTab === 'discussions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion ({comments.length})</span>
              </button>

              <button
                onClick={() => setDrawerTab('api')}
                className={`pb-2 transition-colors border-b-2 flex items-center gap-1.5 ${
                  drawerTab === 'api'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>API Contract ({taskApiDocs.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: TIME TRACKING */}
            {drawerTab === 'timetrack' && (
              <div className="space-y-4">
                {/* Timer Action Box */}
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase">
                      Server-Side Active Timer
                    </div>
                    <div className="font-mono text-xl font-bold text-text-primary mt-1">
                      {isTaskTimerRunning ? (
                        <span className="text-primary flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-accent-pink animate-ping" />
                          Logging time on server...
                        </span>
                      ) : (
                        'Timer Idle'
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isTaskTimerRunning ? (
                      <button
                        onClick={() => handleStopTimer(activeTask.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        <Pause className="w-4 h-4" /> Pause Timer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartTimer(activeTask.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        <Play className="w-4 h-4" /> Start Timer
                      </button>
                    )}
                  </div>
                </div>

                {/* Session Log History */}
                <div>
                  <h6 className="text-xs font-bold text-text-secondary uppercase mb-2">Logged Sessions</h6>
                  <div className="divide-y divide-border-custom bg-white border border-border-custom rounded-xl max-h-48 overflow-y-auto text-xs">
                    {timeLogs.length === 0 ? (
                      <div className="p-4 text-center text-text-secondary">No time logged yet.</div>
                    ) : (
                      timeLogs.map((log) => (
                        <div key={log.id} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-text-primary">{log.userName}</span>
                            <span className="text-text-secondary ml-2 font-mono">
                              {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {log.endTime ? ` - ${new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (active)'}
                            </span>
                            {log.note && <div className="text-[11px] text-text-secondary mt-0.5">{log.note}</div>}
                          </div>
                          <span className="font-mono font-bold text-primary">
                            {(log.durationSeconds / 3600).toFixed(2)}h
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CHECKLIST */}
            {drawerTab === 'checklist' && (
              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
                    <span>Progress:</span>
                    <span className="text-primary">
                      {checklist.length > 0
                        ? Math.round((checklist.filter((c) => c.isDone).length / checklist.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-purple-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent-pink rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          checklist.length > 0
                            ? (checklist.filter((c) => c.isDone).length / checklist.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Gemini AI Trigger Button */}
                <button
                  type="button"
                  onClick={handleAiGenerateChecklist}
                  disabled={aiLoading}
                  className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-primary border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-accent-pink" />
                  <span>{aiLoading ? 'Gemini AI generating subtasks...' : 'Auto-Generate Checklist with Gemini AI'}</span>
                </button>

                {/* Checklist Items */}
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id)}
                      className="flex items-center gap-3 p-2.5 bg-white border border-border-custom hover:bg-purple-50/40 rounded-xl cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.isDone}
                        onChange={() => {}}
                        className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
                      />
                      <span
                        className={`text-xs flex-1 ${
                          item.isDone
                            ? 'line-through text-text-secondary'
                            : 'text-text-primary font-medium'
                        }`}
                      >
                        {item.text}
                      </span>
                      {item.doneByName && (
                        <span className="text-[10px] text-text-secondary bg-purple-50 px-2 py-0.5 rounded-full">
                          ✓ {item.doneByName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Item Input */}
                <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Add a checklist item..."
                    className="flex-1 px-3 py-2 text-xs bg-purple-50 rounded-xl border border-border-custom focus:border-primary outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT 3: DISCUSSIONS & QUERIES */}
            {drawerTab === 'discussions' && (
              <div className="space-y-4">
                {/* Discussion Thread */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-text-secondary">
                      No discussion messages yet. Use @username or @frontend to mention colleagues.
                    </div>
                  ) : (
                    comments.map((comm) => (
                      <div
                        key={comm.id}
                        className={`p-3 rounded-xl border ${
                          comm.type === 'QUERY'
                            ? 'bg-amber-50/40 border-amber-200'
                            : comm.type === 'BLOCKER'
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-white border-border-custom'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-text-primary">
                              {comm.authorName}
                            </span>
                            <TeamTagChip tag={comm.authorTeam} />
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-purple-100 text-primary">
                              {comm.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-secondary">
                            {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                          {comm.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Direct Schedule Meeting Button for unresolved blocker/queries */}
                {(user?.roleName === 'ROLE_ADMIN' || user?.roleName === 'ROLE_MANAGER') && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Need to resolve query quickly?</span>
                    <button
                      type="button"
                      onClick={() => onScheduleMeeting(activeTask)}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-primary-hover shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Schedule Meeting
                    </button>
                  </div>
                )}

                {/* Post New Comment Box */}
                <form onSubmit={handlePostComment} className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCommentType('GENERAL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        commentType === 'GENERAL' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentType('QUERY')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        commentType === 'QUERY' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Query
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentType('BLOCKER')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        commentType === 'BLOCKER' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Blocker
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Write message... Use @username or @frontend, @backend"
                      className="flex-1 p-2.5 text-xs bg-purple-50 rounded-xl border border-border-custom focus:border-primary outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-primary text-white text-xs font-bold rounded-xl flex items-center justify-center hover:bg-primary-hover shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT 4: API CONTRACT SPECS */}
            {drawerTab === 'api' && (
              <div className="space-y-4">
                {taskApiDocs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-text-secondary">
                    No API specification document attached to this task.
                  </div>
                ) : (
                  taskApiDocs.map((doc) => (
                    <div key={doc.id} className="p-4 bg-white border border-border-custom rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {doc.httpMethod}
                          </span>
                          <span className="font-mono text-xs text-text-primary font-semibold">
                            {doc.endpoint}
                          </span>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>

                      {doc.requestBodyJson && (
                        <div>
                          <div className="text-[11px] font-bold text-text-secondary uppercase mb-1">
                            Request Payload
                          </div>
                          <pre className="p-2.5 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto">
                            {doc.requestBodyJson}
                          </pre>
                        </div>
                      )}

                      {doc.responseBodyJson && (
                        <div>
                          <div className="text-[11px] font-bold text-text-secondary uppercase mb-1">
                            Response Payload
                          </div>
                          <pre className="p-2.5 bg-gray-900 text-blue-300 font-mono text-[11px] rounded-lg overflow-x-auto">
                            {doc.responseBodyJson}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sprint Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Task Title</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Implement WebSocket reconnection strategy"
              className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Description</label>
            <textarea
              rows={3}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Detailed acceptance criteria..."
              className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Type</label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              >
                <option value="FEATURE">Feature</option>
                <option value="BUG">Bug</option>
                <option value="QUERY">Query</option>
                <option value="CHORE">Chore</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Multi-Select Assignee */}
          <div className="space-y-2 bg-purple-50/60 p-3 rounded-xl border border-border-custom">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Assign Task
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-primary cursor-pointer hover:underline">
                <input
                  type="checkbox"
                  checked={newTaskIsAllEmployees}
                  onChange={(e) => {
                    setNewTaskIsAllEmployees(e.target.checked);
                    if (e.target.checked) setNewTaskSelectedAssignees([]);
                  }}
                  className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
                />
                <span>🌐 All Employees</span>
              </label>
            </div>

            {newTaskIsAllEmployees ? (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-[11px] text-blue-700 font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Assigned to <strong>All Employees</strong>. Every team member will see and collaborate on this task.</span>
              </div>
            ) : (
              <div>
                <div className="text-[10px] text-text-secondary mb-1.5">
                  Select one or more employees (e.g. Employee 1, Employee 2):
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-border-custom">
                  {assignableUsers.map((u) => {
                    const isSelected = newTaskSelectedAssignees.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                          isSelected ? 'bg-purple-100/70 text-primary font-bold' : 'hover:bg-purple-50 text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTaskSelectedAssignees((prev) => [...prev, u.id]);
                              } else {
                                setNewTaskSelectedAssignees((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
                          />
                          <span>{u.fullName}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {u.teamTag || u.roleName.replace('ROLE_', '')}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {newTaskSelectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newTaskSelectedAssignees.map((id) => {
                      const u = assignableUsers.find((user) => user.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-primary rounded-full text-[10px] font-bold"
                        >
                          {u?.fullName || `User #${id}`}
                          <button
                            type="button"
                            onClick={() => setNewTaskSelectedAssignees((prev) => prev.filter((x) => x !== id))}
                            className="hover:text-rose-600"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Due Date</label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                value={newTaskEstHours}
                onChange={(e) => setNewTaskEstHours(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="enforceChecklist"
              checked={newTaskChecklistEnforced}
              onChange={(e) => setNewTaskChecklistEnforced(e.target.checked)}
              className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
            />
            <label htmlFor="enforceChecklist" className="text-xs text-text-primary font-medium cursor-pointer">
              Enforce completion rule: Task cannot be moved to DONE if checklist is pending
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Create Task
          </button>
        </form>
      </Modal>

      {/* EDIT TASK MODAL (ADMIN / MANAGER) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Task: ${activeTask?.taskCode || ''}`}
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Task Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Description</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              >
                <option value="FEATURE">Feature</option>
                <option value="BUG">Bug</option>
                <option value="QUERY">Query</option>
                <option value="CHORE">Chore</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Multi-Select Assignee */}
          <div className="space-y-2 bg-purple-50/60 p-3 rounded-xl border border-border-custom">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Assign Task
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-primary cursor-pointer hover:underline">
                <input
                  type="checkbox"
                  checked={editIsAllEmployees}
                  onChange={(e) => {
                    setEditIsAllEmployees(e.target.checked);
                    if (e.target.checked) setEditSelectedAssignees([]);
                  }}
                  className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
                />
                <span>🌐 All Employees</span>
              </label>
            </div>

            {editIsAllEmployees ? (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-[11px] text-blue-700 font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Assigned to <strong>All Employees</strong>. Every team member will see and collaborate on this task.</span>
              </div>
            ) : (
              <div>
                <div className="text-[10px] text-text-secondary mb-1.5">
                  Select one or more employees (e.g. Employee 1, Employee 2):
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-border-custom">
                  {assignableUsers.map((u) => {
                    const isSelected = editSelectedAssignees.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                          isSelected ? 'bg-purple-100/70 text-primary font-bold' : 'hover:bg-purple-50 text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditSelectedAssignees((prev) => [...prev, u.id]);
                              } else {
                                setEditSelectedAssignees((prev) => prev.filter((id) => id !== u.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
                          />
                          <span>{u.fullName}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {u.teamTag || u.roleName.replace('ROLE_', '')}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {editSelectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editSelectedAssignees.map((id) => {
                      const u = assignableUsers.find((user) => user.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-primary rounded-full text-[10px] font-bold"
                        >
                          {u?.fullName || `User #${id}`}
                          <button
                            type="button"
                            onClick={() => setEditSelectedAssignees((prev) => prev.filter((x) => x !== id))}
                            className="hover:text-rose-600"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                value={editEstHours}
                onChange={(e) => setEditEstHours(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">Due Date</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50 text-xs text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editEnforceChecklist"
              checked={editChecklistEnforced}
              onChange={(e) => setEditChecklistEnforced(e.target.checked)}
              className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
            />
            <label htmlFor="editEnforceChecklist" className="text-xs text-text-primary font-medium cursor-pointer">
              Enforce checklist completion before DONE
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Save Changes
          </button>
        </form>
      </Modal>
      {/* CUSTOM DELETE CONFIRMATION MODAL (RELIABLE & PERSISTENT) */}
      {taskToDelete && (
        <Modal
          isOpen={!!taskToDelete}
          onClose={() => setTaskToDelete(null)}
          title={`Confirm Task Deletion`}
        >
          <div className="space-y-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently delete task <strong className="text-text-primary">{taskToDelete.taskCode} - {taskToDelete.title}</strong>?
              This action will permanently remove the task from the board and log an entry in the system audit trail.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-border-custom">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = taskToDelete.id;
                  setTaskToDelete(null);
                  await handleDeleteTask(id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
