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
import { mockStore } from './mockStore';

const envApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const isDummyUrl = !envApiUrl || envApiUrl.includes('xxxx') || envApiUrl.includes('placeholder') || envApiUrl.includes('example.com');

const API_BASE_URL = isDummyUrl
  ? (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8080/api/v1'
    : '')
  : envApiUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach Authorization header if access token exists
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('teamcrm_token') || localStorage.getItem('teamcrm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expired / invalid session on protected endpoints -> clear and go to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || '';
    if (status === 401 && !url.startsWith('/auth/') && sessionStorage.getItem('teamcrm_token')) {
      ['teamcrm_token', 'teamcrm_refresh_token', 'teamcrm_user'].forEach((k) => {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      });
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

interface SafeCallOptions {
  /** Never use the mock store when a real backend is configured (use for auth / OTP) */
  strict?: boolean;
  /** Message to show when server answers 401 without a message */
  msg401?: string;
}

/**
 * - If the server ANSWERED with an error (400/401/403/404/500...), that error is shown. No mock fallback.
 * - Mock fallback is used only when there is no backend configured, or (non-strict) when the network is down.
 */
async function safeCall<T>(
  remoteCall: () => Promise<T>,
  fallbackCall: () => T | Promise<T>,
  opts: SafeCallOptions = {}
): Promise<T> {
  if (!API_BASE_URL) {
    return await fallbackCall();
  }
  try {
    return await remoteCall();
  } catch (err: any) {
    if (err?.response) {
      const data = err.response.data;
      let msg: string =
        (typeof data === 'string' && data) ||
        data?.message ||
        '';
      if (!msg && err.response.status === 401 && opts.msg401) msg = opts.msg401;
      if (!msg) msg = data?.error || err.message || 'Request failed';
      const e: any = new Error(msg);
      e.response = err.response;
      throw e;
    }
    if (opts.strict) {
      throw new Error('Cannot reach the server. Please check your connection and try again.');
    }
    console.info('Backend unreachable, using local store fallback:', err?.message || 'Network');
    return await fallbackCall();
  }
}

// AUTH
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return safeCall(
      () => apiClient.post<AuthResponse>('/auth/login', { email, password }).then((res) => res.data),
      () => {
        const users = mockStore.getUsers();
        const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!found) {
          throw new Error('Invalid email or password');
        }
        const expected = found.initialPassword || '1234';
        if (password !== expected) {
          throw new Error('Invalid email or password');
        }
        if (!found.isActive) {
          throw new Error('Your TeamCRM account has been deactivated. Please contact your administrator.');
        }
        return {
          accessToken: 'mock_jwt_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          tokenType: 'Bearer',
          userId: found.id || 1,
          email: found.email,
          fullName: found.fullName,
          role: found.roleName,
          teamTag: found.teamTag,
          isFirstLogin: false,
          permissions: found.permissions || ['ROLE_EMPLOYEE', 'TASK_CREATE', 'TIME_TRACK'],
        };
      },
      { strict: true, msg401: 'Invalid email or password' }
    );
  },
  changePassword: async (oldPassword: string, newPassword: string): Promise<string> => {
    return safeCall(
      () => apiClient.post<string>('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),
      () => 'Password updated successfully',
      { strict: true }
    );
  },
  getMe: async (): Promise<User> => {
    return safeCall(
      () => apiClient.get<User>('/auth/me').then((r) => r.data),
      () => {
        const u = sessionStorage.getItem('teamcrm_user') || localStorage.getItem('teamcrm_user');
        if (u) return JSON.parse(u);
        throw new Error('Not signed in');
      }
    );
  },
  sendForgotPasswordOtp: async (email: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    return safeCall(
      // sending a real email can take a while -> longer timeout
      () => apiClient.post('/auth/forgot-password/send-otp', { email }, { timeout: 40000 }).then((r) => r.data),
      async () => {
        const clean = email.trim().toLowerCase();
        const users = mockStore.getUsers();
        const found = users.find((u) => u.email.toLowerCase() === clean);
        if (!found) {
          throw new Error('Your email is not registered. Contact admin.');
        }
        const targetEmail = found.email;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        sessionStorage.setItem('teamcrm_otp_' + clean, otp);

        let emailDispatched = false;
        let responseJson: any = null;
        try {
          const resp = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, otp }),
          });
          responseJson = await resp.json().catch(() => null);
          if (resp.ok && responseJson?.delivered) {
            emailDispatched = true;
          }
        } catch (e) {
          console.warn('Vercel serverless email dispatch error:', e);
        }

        return {
          success: true,
          message: emailDispatched
            ? `A 6-digit verification code has been dispatched to ${targetEmail}. Please check your inbox.`
            : `A 6-digit verification code has been generated for ${targetEmail}. (Code: ${otp})`,
          otp: emailDispatched ? undefined : otp,
        };
      },
      { strict: true }
    );
  },
  verifyOtp: async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    // The backend has no separate verify-otp endpoint. The OTP is verified on the server
    // in the final "verify-reset" call, so here we only validate the format.
    if (!/^\d{6}$/.test(otp.trim())) {
      throw new Error('Please enter the 6-digit OTP code.');
    }
    if (!API_BASE_URL) {
      const saved = sessionStorage.getItem('teamcrm_otp_' + email.trim().toLowerCase());
      if (saved && saved !== otp.trim()) {
        throw new Error('Incorrect OTP verification code. Please check the 6-digit code.');
      }
    }
    return { success: true, message: 'OTP accepted.' };
  },
  verifyAndResetPassword: async (data: { email: string; otp: string; oldPassword?: string; newPassword: string }): Promise<string> => {
    return safeCall(
      () => apiClient.post('/auth/forgot-password/verify-reset', data).then((r) => r.data),
      () => {
        const users = mockStore.getUsers();
        const found = users.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
        if (found) {
          mockStore.updateUser(found.id, { initialPassword: data.newPassword });
        }
        sessionStorage.removeItem('teamcrm_otp_' + data.email.trim().toLowerCase());
        return 'Password reset successfully';
      },
      { strict: true }
    );
  },
  loginWithGoogle: async (email: string, fullName?: string, googleToken?: string): Promise<AuthResponse> => {
    return safeCall(
      () => apiClient.post<AuthResponse>('/auth/google', { email, fullName, googleToken }).then((res) => res.data),
      () => {
        const users = mockStore.getUsers();
        const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!found) {
          throw new Error('Your email is not registered. Contact admin.');
        }
        if (!found.isActive) {
          throw new Error('Your TeamCRM account has been deactivated. Please contact your administrator.');
        }
        return {
          accessToken: 'mock_google_token_' + Date.now(),
          refreshToken: 'mock_google_refresh_' + Date.now(),
          tokenType: 'Bearer',
          userId: found.id || 1,
          email: found.email,
          fullName: found.fullName,
          role: found.roleName,
          teamTag: found.teamTag,
          isFirstLogin: false,
          permissions: found.permissions || ['ROLE_EMPLOYEE'],
        };
      },
      { strict: true, msg401: 'Your email is not registered. Contact admin.' }
    );
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
      () => mockStore.createUser(data),
      { strict: true }
    );
  },
  toggleStatus: async (userId: number): Promise<void> => {
    return safeCall(
      () => apiClient.patch(`/users/${userId}/toggle-status`).then(() => { }),
      () => mockStore.toggleStatus(userId)
    );
  },
  updatePermissions: async (userId: number, permissionCodes: string[]): Promise<void> => {
    return safeCall(
      () => apiClient.put(`/users/${userId}/permissions`, { userId, permissionCodes }).then(() => { }),
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
      () => apiClient.delete(`/users/${id}`).then(() => { }),
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
      () => apiClient.delete(`/tasks/${id}`).then(() => { }),
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
      () => apiClient.delete(`/tasks/checklist/${itemId}`).then(() => { }),
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
      () => mockStore.createApiDoc(data)
    );
  },
  addComment: async (apiDocId: number, text: string, authorName: string, authorRole?: string): Promise<any> => {
    return safeCall(
      () => apiClient.post(`/api-docs/${apiDocId}/comments`, { text, authorName, authorRole }).then((r) => r.data),
      () => mockStore.addApiComment(apiDocId, { text, authorName, authorRole })
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
          attendeeNames: ['Payal Jadhao'],
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
      () => apiClient.delete(`/meetings/${id}`).then(() => { }),
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
      () => apiClient.patch(`/notifications/${id}/read`).then(() => { }),
      () => { }
    );
  },
  markAllAsRead: async (): Promise<void> => {
    return safeCall(
      () => apiClient.patch('/notifications/read-all').then(() => { }),
      () => { }
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

// AI ASSIST (Gemini Chatbot)
export const aiApi = {
  generate: async (contextType: string, content: string, prompt?: string, apiKey?: string): Promise<{ result: string; items: string[] }> => {
    const rawQuery = content || prompt || '';
    const effectiveKey = apiKey || localStorage.getItem('teamcrm_gemini_api_key') || '';

    if (effectiveKey && effectiveKey.trim().length > 10) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are Gemini AI Chatbot, a friendly, intelligent, and versatile assistant integrated into TeamCRM. Answer naturally, helpfully, and conversationally in GitHub markdown.\nUser query: ${rawQuery}`
                }]
              }]
            })
          }
        );
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            return { result: text.trim(), items: [] };
          }
        }
      } catch (err) {
        console.warn('Direct Gemini call error, falling back to local engine:', err);
      }
    }

    return safeCall(
      () => apiClient.post('/ai/generate', { contextType, content, prompt, apiKey: effectiveKey }, { timeout: 60000 }).then((r) => r.data),
      async () => {
        if (contextType === 'CHECKLIST') {
          return {
            result: 'Generated action checklist for task execution.',
            items: [
              'Verify data schema and entity annotations',
              'Implement transactional service boundaries',
              'Validate RBAC permissions and error handling'
            ]
          };
        }
        const liveAiText = await callLiveLlmDirect(rawQuery);
        if (liveAiText) {
          return { result: liveAiText, items: [] };
        }
        return { result: generateChatbotResponse(rawQuery), items: [] };
      }
    );
  },
};

async function callLiveLlmDirect(userQuery: string): Promise<string | null> {
  const models = ['openai-fast', 'openai'];

  for (const model of models) {
    try {
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are Gemini AI Chatbot, an intelligent and helpful AI assistant for TeamCRM. Answer questions naturally, conversationally, and informatively in English with clean GitHub Markdown. When asked about a sprint task, write a comprehensive, customized technical elaboration specific to that task.'
            },
            { role: 'user', content: userQuery }
          ],
          model
        })
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) return text.trim();
      }
    } catch { }
  }

  for (const model of models) {
    try {
      const getRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(userQuery)}?model=${model}`);
      if (getRes.ok) {
        const text = await getRes.text();
        if (text && text.trim().length > 0) return text.trim();
      }
    } catch { }
  }
  return null;
}

function generateChatbotResponse(rawQuery: string): string {
  const q = rawQuery.toLowerCase().trim();

  if (q === 'hi' || q === 'hello' || q === 'hey' || q === 'hi there' || q === 'greetings') {
    return 'Hi there! How can I help you today?';
  }
  if (q.includes('how are you') || q === "how're you") {
    return "I'm doing well, thanks for asking! How can I help you today?";
  }
  if (q === 'thank you' || q === 'thanks' || q.includes('thank you')) {
    return "You're very welcome! Let me know if you need help with anything else.";
  }

  return "I am currently unable to reach the live AI language model. Please check your internet connection or configure your Google Gemini API key in the widget settings.";
}