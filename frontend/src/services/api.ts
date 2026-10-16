import axios from 'axios';
import {
  AuthResponse,
  User,
  Task,
  ChecklistItem,
  TimeLog,
  RunningTimer,
  TaskComment,
  ApiDoc,
  Meeting,
  Lead,
  Customer,
  Deal,
  NotificationItem,
  ManagerDashboard,
  EmployeeDashboard,
  AuditLogItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if access token exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('teamcrm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and let App redirect to login if not already on login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('teamcrm_token');
        localStorage.removeItem('teamcrm_user');
      }
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  changePassword: async (oldPassword: string, newPassword: string): Promise<string> => {
    const res = await apiClient.post<string>('/auth/change-password', { oldPassword, newPassword });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
  sendForgotPasswordOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post('/auth/forgot-password/send-otp', { email });
    return res.data;
  },
  verifyAndResetPassword: async (data: { email: string; otp: string; oldPassword?: string; newPassword: string }): Promise<string> => {
    const res = await apiClient.post('/auth/forgot-password/verify-reset', data);
    return res.data;
  },
  loginWithGoogle: async (email: string, fullName?: string, googleToken?: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/google', { email, fullName, googleToken });
    return res.data;
  },
};

// USERS & PERMISSIONS
export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users');
    return res.data;
  },
  createUser: async (data: {
    email: string;
    fullName: string;
    tempPassword?: string;
    roleName: string;
    teamTag?: string;
    phone?: string;
    extraPermissions?: string[];
  }): Promise<User> => {
    const res = await apiClient.post<User>('/users', data);
    return res.data;
  },
  toggleStatus: async (userId: number): Promise<void> => {
    await apiClient.patch(`/users/${userId}/toggle-status`);
  },
  updatePermissions: async (userId: number, permissionCodes: string[]): Promise<void> => {
    await apiClient.put(`/users/${userId}/permissions`, { userId, permissionCodes });
  },
  getAllPermissions: async (): Promise<{ id: number; code: string; module: string; description: string }[]> => {
    const res = await apiClient.get('/users/meta/permissions');
    return res.data;
  },
  updateUser: async (id: number, data: any): Promise<User> => {
    const res = await apiClient.put<User>(`/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

// TASKS & KANBAN
export const taskApi = {
  getTasks: async (params?: { projectId?: number; assigneeId?: number; status?: string; priority?: string }): Promise<Task[]> => {
    const res = await apiClient.get<Task[]>('/tasks', { params });
    return res.data;
  },
  getTaskById: async (id: number): Promise<Task> => {
    const res = await apiClient.get<Task>(`/tasks/${id}`);
    return res.data;
  },
  createTask: async (data: any): Promise<Task> => {
    const res = await apiClient.post<Task>('/tasks', data);
    return res.data;
  },
  updateStatus: async (id: number, status: string): Promise<Task> => {
    const res = await apiClient.patch<Task>(`/tasks/${id}/status`, { status });
    return res.data;
  },
  updateTask: async (id: number, data: any): Promise<Task> => {
    const res = await apiClient.put<Task>(`/tasks/${id}`, data);
    return res.data;
  },
  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
  // Checklist
  getChecklist: async (taskId: number): Promise<ChecklistItem[]> => {
    const res = await apiClient.get<ChecklistItem[]>(`/tasks/${taskId}/checklist`);
    return res.data;
  },
  addChecklistItem: async (taskId: number, text: string): Promise<ChecklistItem> => {
    const res = await apiClient.post<ChecklistItem>(`/tasks/${taskId}/checklist`, { text });
    return res.data;
  },
  toggleChecklistItem: async (itemId: number): Promise<ChecklistItem> => {
    const res = await apiClient.patch<ChecklistItem>(`/tasks/checklist/${itemId}/toggle`);
    return res.data;
  },
  deleteChecklistItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/tasks/checklist/${itemId}`);
  },
};

// TIME TRACKING
export const timeApi = {
  startTimer: async (taskId: number, note?: string): Promise<RunningTimer> => {
    const res = await apiClient.post<RunningTimer>('/time/start', { taskId, note });
    return res.data;
  },
  stopTimer: async (note?: string): Promise<TimeLog> => {
    const res = await apiClient.post<TimeLog>('/time/stop', { note });
    return res.data;
  },
  getActiveTimer: async (): Promise<RunningTimer | null> => {
    const res = await apiClient.get<RunningTimer | null>('/time/active');
    return res.data;
  },
  getTaskLogs: async (taskId: number): Promise<TimeLog[]> => {
    const res = await apiClient.get<TimeLog[]>(`/time/task/${taskId}`);
    return res.data;
  },
  getMyLogs: async (): Promise<TimeLog[]> => {
    const res = await apiClient.get<TimeLog[]>('/time/my-logs');
    return res.data;
  },
  createManualLog: async (data: {
    taskId: number;
    userId: number;
    durationSeconds: number;
    note?: string;
  }): Promise<TimeLog> => {
    const res = await apiClient.post<TimeLog>('/time/manual', data);
    return res.data;
  },
};

// DISCUSSIONS
export const discussionApi = {
  getComments: async (taskId: number, type?: string): Promise<TaskComment[]> => {
    const res = await apiClient.get<TaskComment[]>(`/discussions/task/${taskId}`, { params: { type } });
    return res.data;
  },
  postComment: async (taskId: number, body: string, type: string = 'GENERAL', parentId?: number): Promise<TaskComment> => {
    const res = await apiClient.post<TaskComment>('/discussions', { taskId, body, type, parentId });
    return res.data;
  },
  updateQueryStatus: async (commentId: number, status: string): Promise<TaskComment> => {
    const res = await apiClient.patch<TaskComment>(`/discussions/${commentId}/status`, null, { params: { status } });
    return res.data;
  },
};

// API HANDOFF
export const apiHandoffApi = {
  getAll: async (): Promise<ApiDoc[]> => {
    const res = await apiClient.get<ApiDoc[]>('/api-docs');
    return res.data;
  },
  getByTaskId: async (taskId: number): Promise<ApiDoc[]> => {
    const res = await apiClient.get<ApiDoc[]>(`/api-docs/task/${taskId}`);
    return res.data;
  },
  createApiDoc: async (data: any): Promise<ApiDoc> => {
    const res = await apiClient.post<ApiDoc>('/api-docs', data);
    return res.data;
  },
  updateStatus: async (id: number, status: string, notes?: string): Promise<ApiDoc> => {
    const res = await apiClient.patch<ApiDoc>(`/api-docs/${id}/status`, { status, notes });
    return res.data;
  },
};

// MEETINGS
export const meetingApi = {
  getAll: async (): Promise<Meeting[]> => {
    const res = await apiClient.get<Meeting[]>('/meetings');
    return res.data;
  },
  getMyMeetings: async (): Promise<Meeting[]> => {
    const res = await apiClient.get<Meeting[]>('/meetings/my-meetings');
    return res.data;
  },
  scheduleMeeting: async (data: any): Promise<Meeting> => {
    const res = await apiClient.post<Meeting>('/meetings', data);
    return res.data;
  },
  updateNotes: async (id: number, notes: string, actionItemsJson?: string): Promise<Meeting> => {
    const res = await apiClient.put<Meeting>(`/meetings/${id}/notes`, { notes, actionItemsJson });
    return res.data;
  },
  updateMeeting: async (id: number, data: any): Promise<Meeting> => {
    const res = await apiClient.put<Meeting>(`/meetings/${id}`, data);
    return res.data;
  },
  deleteMeeting: async (id: number): Promise<void> => {
    await apiClient.delete(`/meetings/${id}`);
  },
};

// CRM
export const crmApi = {
  getLeads: async (): Promise<Lead[]> => {
    const res = await apiClient.get<Lead[]>('/crm/leads');
    return res.data;
  },
  createLead: async (data: any): Promise<Lead> => {
    const res = await apiClient.post<Lead>('/crm/leads', data);
    return res.data;
  },
  updateLeadStatus: async (id: number, status: string): Promise<Lead> => {
    const res = await apiClient.patch<Lead>(`/crm/leads/${id}/status`, null, { params: { status } });
    return res.data;
  },
  getCustomers: async (): Promise<Customer[]> => {
    const res = await apiClient.get<Customer[]>('/crm/customers');
    return res.data;
  },
  createCustomer: async (data: any): Promise<Customer> => {
    const res = await apiClient.post<Customer>('/crm/customers', data);
    return res.data;
  },
  getDeals: async (): Promise<Deal[]> => {
    const res = await apiClient.get<Deal[]>('/crm/deals');
    return res.data;
  },
  createDeal: async (data: any): Promise<Deal> => {
    const res = await apiClient.post<Deal>('/crm/deals', data);
    return res.data;
  },
  updateDealStage: async (id: number, stage: string): Promise<Deal> => {
    const res = await apiClient.patch<Deal>(`/crm/deals/${id}/stage`, null, { params: { stage } });
    return res.data;
  },
};

// DASHBOARDS
export const dashboardApi = {
  getManagerDashboard: async (): Promise<ManagerDashboard> => {
    const res = await apiClient.get<ManagerDashboard>('/dashboard/manager');
    return res.data;
  },
  getEmployeeDashboard: async (): Promise<EmployeeDashboard> => {
    const res = await apiClient.get<EmployeeDashboard>('/dashboard/employee');
    return res.data;
  },
};

// NOTIFICATIONS
export const notificationApi = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};

// AUDIT
export const auditApi = {
  getLogs: async (params?: { entityName?: string; actorId?: number }): Promise<AuditLogItem[]> => {
    const res = await apiClient.get<AuditLogItem[]>('/audit', { params });
    return res.data;
  },
};

// AI ASSIST (Gemini)
export const aiApi = {
  generate: async (contextType: string, content: string, prompt?: string, apiKey?: string): Promise<{ result: string; items: string[] }> => {
    const res = await apiClient.post('/ai/generate', { contextType, content, prompt, apiKey });
    return res.data;
  },
};
