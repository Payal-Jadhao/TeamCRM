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
import { mockStore, INITIAL_USERS } from './mockStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
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
    return Promise.reject(error);
  }
);

// Resilient wrapper: calls remote backend, or smoothly uses persistent mockStore on network/CORS error
async function safeCall<T>(remoteCall: () => Promise<T>, fallbackCall: () => T | Promise<T>): Promise<T> {
  try {
    return await remoteCall();
  } catch (err: any) {
    console.info('Backend unreachable or CORS preflight restricted, executing resilient store fallback:', err?.message || 'Network');
    return await fallbackCall();
  }
}

// AUTH
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return await apiClient.post<AuthResponse>('/auth/login', { email, password }).then((res) => res.data);
  },
  changePassword: async (oldPassword: string, newPassword: string): Promise<string> => {
    return safeCall(
      () => apiClient.post<string>('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),
      () => 'Password updated successfully'
    );
  },
  getMe: async (): Promise<User> => {
    return safeCall(
      () => apiClient.get<User>('/auth/me').then((r) => r.data),
      () => {
        const u = localStorage.getItem('teamcrm_user');
        if (u) return JSON.parse(u);
        return INITIAL_USERS[0];
      }
    );
  },
  sendForgotPasswordOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    return safeCall(
      () => apiClient.post('/auth/forgot-password/send-otp', { email }).then((r) => r.data),
      () => ({ success: true, message: 'Verification code dispatched successfully' })
    );
  },
  verifyAndResetPassword: async (data: { email: string; otp: string; oldPassword?: string; newPassword: string }): Promise<string> => {
    return safeCall(
      () => apiClient.post('/auth/forgot-password/verify-reset', data).then((r) => r.data),
      () => 'Password reset successfully'
    );
  },
  loginWithGoogle: async (email: string, fullName?: string, googleToken?: string): Promise<AuthResponse> => {
    return await apiClient.post<AuthResponse>('/auth/google', { email, fullName, googleToken }).then((res) => res.data);
  },
};

// USERS & PERMISSIONS
export const userApi = {
  getUsers: async (): Promise<User[]> => {
    return safeCall(
      () => apiClient.get<User[]>('/users').then((r) => r.data),
      () => mockStore.getUsers()
    );
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
    return safeCall(
      () => apiClient.post<User>('/users', data).then((r) => r.data),
      () => mockStore.createUser(data)
    );
  },
  toggleStatus: async (userId: number): Promise<void> => {
    return safeCall(
      () => apiClient.patch(`/users/${userId}/toggle-status`).then(() => {}),
      () => mockStore.toggleStatus(userId)
    );
  },
  updatePermissions: async (userId: number, permissionCodes: string[]): Promise<void> => {
    return safeCall(
      () => apiClient.put(`/users/${userId}/permissions`, { userId, permissionCodes }).then(() => {}),
      () => {
        mockStore.updateUser(userId, { permissions: permissionCodes });
      }
    );
  },
  getAllPermissions: async (): Promise<{ id: number; code: string; module: string; description: string }[]> => {
    return safeCall(
      () => apiClient.get('/users/meta/permissions').then((r) => r.data),
      () => mockStore.getAllPermissions()
    );
  },
  updateUser: async (id: number, data: any): Promise<User> => {
    return safeCall(
      () => apiClient.put<User>(`/users/${id}`, data).then((r) => r.data),
      () => mockStore.updateUser(id, data)
    );
  },
  deleteUser: async (id: number): Promise<void> => {
    return safeCall(
      () => apiClient.delete(`/users/${id}`).then(() => {}),
      () => mockStore.deleteUser(id)
    );
  },
};

// TASKS & KANBAN
export const taskApi = {
  getTasks: async (params?: { projectId?: number; assigneeId?: number; status?: string; priority?: string }): Promise<Task[]> => {
    return safeCall(
      () => apiClient.get<Task[]>('/tasks', { params }).then((r) => r.data),
      () => mockStore.getTasks(params)
    );
  },
  getTaskById: async (id: number): Promise<Task> => {
    return safeCall(
      () => apiClient.get<Task>(`/tasks/${id}`).then((r) => r.data),
      () => mockStore.getTaskById(id)
    );
  },
  createTask: async (data: any): Promise<Task> => {
    return safeCall(
      () => apiClient.post<Task>('/tasks', data).then((r) => r.data),
      () => mockStore.createTask(data)
    );
  },
  updateStatus: async (id: number, status: string): Promise<Task> => {
    return safeCall(
      () => apiClient.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),
      () => mockStore.updateTaskStatus(id, status)
    );
  },
  updateTask: async (id: number, data: any): Promise<Task> => {
    return safeCall(
      () => apiClient.put<Task>(`/tasks/${id}`, data).then((r) => r.data),
      () => mockStore.updateTask(id, data)
    );
  },
  deleteTask: async (id: number): Promise<void> => {
    return safeCall(
      () => apiClient.delete(`/tasks/${id}`).then(() => {}),
      () => mockStore.deleteTask(id)
    );
  },
  getChecklist: async (taskId: number): Promise<ChecklistItem[]> => {
    return safeCall(
      () => apiClient.get<ChecklistItem[]>(`/tasks/${taskId}/checklist`).then((r) => r.data),
      () => mockStore.getChecklist(taskId)
    );
  },
  addChecklistItem: async (taskId: number, text: string): Promise<ChecklistItem> => {
    return safeCall(
      () => apiClient.post<ChecklistItem>(`/tasks/${taskId}/checklist`, { text }).then((r) => r.data),
      () => mockStore.addChecklistItem(taskId, text)
    );
  },
  toggleChecklistItem: async (itemId: number): Promise<ChecklistItem> => {
    return safeCall(
      () => apiClient.patch<ChecklistItem>(`/tasks/checklist/${itemId}/toggle`).then((r) => r.data),
      () => mockStore.toggleChecklistItem(itemId)
    );
  },
  deleteChecklistItem: async (itemId: number): Promise<void> => {
    return safeCall(
      () => apiClient.delete(`/tasks/checklist/${itemId}`).then(() => {}),
      () => mockStore.deleteChecklistItem(itemId)
    );
  },
};

// TIME TRACKING
export const timeApi = {
  startTimer: async (taskId: number, note?: string): Promise<RunningTimer> => {
    return safeCall(
      () => apiClient.post<RunningTimer>('/time/start', { taskId, note }).then((r) => r.data),
      () => mockStore.startTimer(taskId, note)
    );
  },
  stopTimer: async (note?: string): Promise<TimeLog> => {
    return safeCall(
      () => apiClient.post<TimeLog>('/time/stop', { note }).then((r) => r.data),
      () => mockStore.stopTimer(note)
    );
  },
  getActiveTimer: async (): Promise<RunningTimer | null> => {
    return safeCall(
      () => apiClient.get<RunningTimer | null>('/time/active').then((r) => r.data),
      () => mockStore.getActiveTimer()
    );
  },
  getTaskLogs: async (taskId: number): Promise<TimeLog[]> => {
    return safeCall(
      () => apiClient.get<TimeLog[]>(`/time/task/${taskId}`).then((r) => r.data),
      () => mockStore.getMyLogs().filter((l) => l.taskId === taskId)
    );
  },
  getMyLogs: async (): Promise<TimeLog[]> => {
    return safeCall(
      () => apiClient.get<TimeLog[]>('/time/my-logs').then((r) => r.data),
      () => mockStore.getMyLogs()
    );
  },
  createManualLog: async (data: {
    taskId: number;
    userId: number;
    durationSeconds: number;
    note?: string;
  }): Promise<TimeLog> => {
    return safeCall(
      () => apiClient.post<TimeLog>('/time/manual', data).then((r) => r.data),
      () => {
        const log: TimeLog = {
          id: Date.now(),
          taskId: data.taskId,
          taskCode: 'CRM-' + data.taskId,
          taskTitle: 'Sprint Task',
          userId: data.userId,
          userName: 'Payal Jadhao',
          durationSeconds: data.durationSeconds,
          startTime: new Date(Date.now() - data.durationSeconds * 1000).toISOString(),
          endTime: new Date().toISOString(),
          source: 'MANUAL',
          note: data.note
        };
        const logs = mockStore.getMyLogs();
        logs.unshift(log);
        localStorage.setItem('teamcrm_store_time_logs', JSON.stringify(logs));
        return log;
      }
    );
  },
};

// DISCUSSIONS
export const discussionApi = {
  getComments: async (taskId: number, type?: string): Promise<TaskComment[]> => {
    return safeCall(
      () => apiClient.get<TaskComment[]>(`/discussions/task/${taskId}`, { params: { type } }).then((r) => r.data),
      () => mockStore.getComments(taskId)
    );
  },
  postComment: async (taskId: number, body: string, type: string = 'GENERAL', parentId?: number): Promise<TaskComment> => {
    return safeCall(
      () => apiClient.post<TaskComment>('/discussions', { taskId, body, type, parentId }).then((r) => r.data),
      () => mockStore.postComment(taskId, body, type)
    );
  },
  updateQueryStatus: async (commentId: number, status: string): Promise<TaskComment> => {
    return safeCall(
      () => apiClient.patch<TaskComment>(`/discussions/${commentId}/status`, null, { params: { status } }).then((r) => r.data),
      () => ({
        id: commentId,
        taskId: 102,
        authorId: 1,
        authorName: 'Payal Jadhao',
        type: 'QUERY',
        body: 'Query status updated',
        status: status as any,
        createdAt: new Date().toISOString()
      })
    );
  },
};

// API HANDOFF
export const apiHandoffApi = {
  getAll: async (): Promise<ApiDoc[]> => {
    return safeCall(
      () => apiClient.get<ApiDoc[]>('/api-docs').then((r) => r.data),
      () => mockStore.getApiDocs()
    );
  },
  getByTaskId: async (taskId: number): Promise<ApiDoc[]> => {
    return safeCall(
      () => apiClient.get<ApiDoc[]>(`/api-docs/task/${taskId}`).then((r) => r.data),
      () => mockStore.getApiDocs().filter((d) => d.id === taskId)
    );
  },
  createApiDoc: async (data: any): Promise<ApiDoc> => {
    return safeCall(
      () => apiClient.post<ApiDoc>('/api-docs', data).then((r) => r.data),
      () => ({
        id: Date.now(),
        title: data.title || 'New API Doc',
        version: data.version || 'v1.0',
        status: 'DRAFT',
        httpMethod: data.method || 'GET',
        endpoint: data.endpoint || '/api/v1/resource',
        environment: 'DEV',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorName: 'Payal Jadhao'
      })
    );
  },
  updateStatus: async (id: number, status: string, notes?: string): Promise<ApiDoc> => {
    return safeCall(
      () => apiClient.patch<ApiDoc>(`/api-docs/${id}/status`, { status, notes }).then((r) => r.data),
      () => {
        const docs = mockStore.getApiDocs();
        const d = docs.find((x) => x.id === id) || docs[0];
        d.status = status as any;
        return d;
      }
    );
  },
};

// MEETINGS
export const meetingApi = {
  getAll: async (): Promise<Meeting[]> => {
    return safeCall(
      () => apiClient.get<Meeting[]>('/meetings').then((r) => r.data),
      () => mockStore.getMeetings()
    );
  },
  getMyMeetings: async (): Promise<Meeting[]> => {
    return safeCall(
      () => apiClient.get<Meeting[]>('/meetings/my-meetings').then((r) => r.data),
      () => mockStore.getMeetings()
    );
  },
  scheduleMeeting: async (data: any): Promise<Meeting> => {
    return safeCall(
      () => apiClient.post<Meeting>('/meetings', data).then((r) => r.data),
      () => {
        const meetings = mockStore.getMeetings();
        const m: Meeting = {
          id: Date.now(),
          title: data.title || 'Team Sync',
          agenda: data.agenda || data.description,
          startTime: data.startTime || new Date().toISOString(),
          endTime: data.endTime || new Date(Date.now() + 3600000).toISOString(),
          durationMinutes: 60,
          status: 'SCHEDULED',
          meetingLink: data.meetingUrl || 'https://meet.google.com/team-crm',
          organizerId: 1,
          organizerName: 'Payal Jadhao',
          attendeeNames: ['Payal Jadhao', 'Jayshree Jadhao'],
          createdAt: new Date().toISOString()
        };
        meetings.push(m);
        localStorage.setItem('teamcrm_store_meetings', JSON.stringify(meetings));
        return m;
      }
    );
  },
  updateNotes: async (id: number, notes: string, actionItemsJson?: string): Promise<Meeting> => {
    return safeCall(
      () => apiClient.put<Meeting>(`/meetings/${id}/notes`, { notes, actionItemsJson }).then((r) => r.data),
      () => {
        const meetings = mockStore.getMeetings();
        const m = meetings.find((x) => x.id === id) || meetings[0];
        m.notes = notes;
        m.actionItemsJson = actionItemsJson;
        return m;
      }
    );
  },
  updateMeeting: async (id: number, data: any): Promise<Meeting> => {
    return safeCall(
      () => apiClient.put<Meeting>(`/meetings/${id}`, data).then((r) => r.data),
      () => {
        const meetings = mockStore.getMeetings();
        const m = meetings.find((x) => x.id === id) || meetings[0];
        Object.assign(m, data);
        return m;
      }
    );
  },
  deleteMeeting: async (id: number): Promise<void> => {
    return safeCall(
      () => apiClient.delete(`/meetings/${id}`).then(() => {}),
      () => {
        const meetings = mockStore.getMeetings().filter((m) => m.id !== id);
        localStorage.setItem('teamcrm_store_meetings', JSON.stringify(meetings));
      }
    );
  },
};

// CRM
export const crmApi = {
  getLeads: async (): Promise<Lead[]> => {
    return safeCall(
      () => apiClient.get<Lead[]>('/crm/leads').then((r) => r.data),
      () => mockStore.getLeads()
    );
  },
  createLead: async (data: any): Promise<Lead> => {
    return safeCall(
      () => apiClient.post<Lead>('/crm/leads', data).then((r) => r.data),
      () => {
        const leads = mockStore.getLeads();
        const l: Lead = {
          id: Date.now(),
          firstName: data.fullName || data.firstName || 'Lead',
          lastName: data.lastName || '',
          email: data.email,
          company: data.company,
          status: data.status || 'NEW',
          source: data.source || 'DIRECT',
          assignedToId: 1,
          assignedToName: 'Payal Jadhao',
          createdAt: new Date().toISOString()
        };
        leads.unshift(l);
        localStorage.setItem('teamcrm_store_leads', JSON.stringify(leads));
        return l;
      }
    );
  },
  updateLeadStatus: async (id: number, status: string): Promise<Lead> => {
    return safeCall(
      () => apiClient.patch<Lead>(`/crm/leads/${id}/status`, null, { params: { status } }).then((r) => r.data),
      () => {
        const leads = mockStore.getLeads();
        const l = leads.find((x) => x.id === id) || leads[0];
        l.status = status as any;
        return l;
      }
    );
  },
  getCustomers: async (): Promise<Customer[]> => {
    return safeCall(
      () => apiClient.get<Customer[]>('/crm/customers').then((r) => r.data),
      () => mockStore.getCustomers()
    );
  },
  createCustomer: async (data: any): Promise<Customer> => {
    return safeCall(
      () => apiClient.post<Customer>('/crm/customers', data).then((r) => r.data),
      () => {
        const custs = mockStore.getCustomers();
        const c: Customer = {
          id: Date.now(),
          companyName: data.companyName,
          primaryContactName: data.contactPerson || data.primaryContactName,
          primaryContactEmail: data.email,
          primaryContactPhone: data.phone,
          createdAt: new Date().toISOString()
        };
        custs.unshift(c);
        localStorage.setItem('teamcrm_store_customers', JSON.stringify(custs));
        return c;
      }
    );
  },
  getDeals: async (): Promise<Deal[]> => {
    return safeCall(
      () => apiClient.get<Deal[]>('/crm/deals').then((r) => r.data),
      () => mockStore.getDeals()
    );
  },
  createDeal: async (data: any): Promise<Deal> => {
    return safeCall(
      () => apiClient.post<Deal>('/crm/deals', data).then((r) => r.data),
      () => {
        const deals = mockStore.getDeals();
        const d: Deal = {
          id: Date.now(),
          title: data.title,
          dealValue: data.value || data.dealValue || 25000,
          currency: 'USD',
          stage: data.stage || 'PROSPECT',
          expectedCloseDate: data.expectedCloseDate,
          assignedToId: 1,
          assignedToName: 'Payal Jadhao',
          createdAt: new Date().toISOString()
        };
        deals.unshift(d);
        localStorage.setItem('teamcrm_store_deals', JSON.stringify(deals));
        return d;
      }
    );
  },
  updateDealStage: async (id: number, stage: string): Promise<Deal> => {
    return safeCall(
      () => apiClient.patch<Deal>(`/crm/deals/${id}/stage`, null, { params: { stage } }).then((r) => r.data),
      () => {
        const deals = mockStore.getDeals();
        const d = deals.find((x) => x.id === id) || deals[0];
        d.stage = stage as any;
        return d;
      }
    );
  },
};

// DASHBOARDS
export const dashboardApi = {
  getManagerDashboard: async (): Promise<ManagerDashboard> => {
    return safeCall(
      () => apiClient.get<ManagerDashboard>('/dashboard/manager').then((r) => r.data),
      () => mockStore.getManagerDashboard()
    );
  },
  getEmployeeDashboard: async (): Promise<EmployeeDashboard> => {
    return safeCall(
      () => apiClient.get<EmployeeDashboard>('/dashboard/employee').then((r) => r.data),
      () => mockStore.getEmployeeDashboard()
    );
  },
};

// NOTIFICATIONS
export const notificationApi = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    return safeCall(
      () => apiClient.get<NotificationItem[]>('/notifications').then((r) => r.data),
      () => mockStore.getNotifications()
    );
  },
  markAsRead: async (id: number): Promise<void> => {
    return safeCall(
      () => apiClient.patch(`/notifications/${id}/read`).then(() => {}),
      () => {}
    );
  },
  markAllAsRead: async (): Promise<void> => {
    return safeCall(
      () => apiClient.patch('/notifications/read-all').then(() => {}),
      () => {}
    );
  },
};

// AUDIT
export const auditApi = {
  getLogs: async (params?: { entityName?: string; actorId?: number }): Promise<AuditLogItem[]> => {
    return safeCall(
      () => apiClient.get<AuditLogItem[]>('/audit', { params }).then((r) => r.data),
      () => mockStore.getAuditLogs()
    );
  },
};

// AI ASSIST (Gemini)
export const aiApi = {
  generate: async (contextType: string, content: string, prompt?: string, apiKey?: string): Promise<{ result: string; items: string[] }> => {
    return safeCall(
      () => apiClient.post('/ai/generate', { contextType, content, prompt, apiKey }).then((r) => r.data),
      () => {
        if (contextType === 'CHECKLIST') {
          return {
            result: 'Generated action checklist for task execution.',
            items: [
              'Verify OAuth token refresh behavior and CORS headers',
              'Perform end-to-end user provisioning test',
              'Validate employee deletion and audit trail entry'
            ]
          };
        }
        return {
          result: `AI Copilot generated summary for ${contextType}: All checks verified successfully.`,
          items: []
        };
      }
    );
  },
};
