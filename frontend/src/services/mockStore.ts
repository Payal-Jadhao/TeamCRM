import {
  User,
  Project,
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

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'payaldjadhao@gmail.com',
    fullName: 'Payal Jadhao',
    roleName: 'ROLE_ADMIN',
    teamTag: 'MANAGEMENT',
    initialPassword: '123456',
    isActive: true,
    isFirstLogin: false,
    permissions: [
      'ROLE_ADMIN', 'USER_CREATE', 'USER_EDIT', 'USER_DEACTIVATE', 'ROLE_MANAGE',
      'PROJECT_CREATE', 'PROJECT_EDIT', 'TASK_CREATE', 'TASK_ASSIGN', 'TASK_EDIT',
      'TASK_DELETE', 'TIME_TRACK', 'TIME_EDIT_MANUAL', 'CHECKLIST_MANAGE',
      'DISCUSSION_POST', 'DISCUSSION_MENTION_ALL', 'DISCUSSION_MODERATE',
      'API_DOC_PUBLISH', 'API_DOC_REVIEW', 'MEETING_SCHEDULE', 'MEETING_EDIT_NOTES',
      'LEAD_VIEW_ALL', 'LEAD_MANAGE', 'DEAL_MANAGE', 'REPORT_VIEW', 'AUDIT_VIEW'
    ]
  },
  {
    id: 3,
    email: 'jayshreejadhao0206@gmail.com',
    fullName: 'Jayshree Jadhao',
    roleName: 'ROLE_MANAGER',
    teamTag: 'FRONTEND',
    initialPassword: 'Pass@123321',
    isActive: true,
    isFirstLogin: false,
    permissions: [
      'ROLE_MANAGER', 'USER_EDIT', 'TASK_CREATE', 'TASK_ASSIGN', 'TASK_EDIT',
      'TIME_TRACK', 'TIME_EDIT_MANUAL', 'CHECKLIST_MANAGE', 'DISCUSSION_POST',
      'API_DOC_REVIEW', 'MEETING_SCHEDULE', 'MEETING_EDIT_NOTES', 'LEAD_MANAGE', 'REPORT_VIEW'
    ]
  },
  {
    id: 4,
    email: 'rahaamalhotra@gmail.com',
    fullName: 'Rahaa Malhotra',
    roleName: 'ROLE_EMPLOYEE',
    teamTag: 'FRONTEND',
    initialPassword: 'Pass#123',
    isActive: true,
    isFirstLogin: false,
    permissions: [
      'ROLE_EMPLOYEE', 'TASK_CREATE', 'TASK_EDIT', 'TIME_TRACK', 'CHECKLIST_MANAGE',
      'DISCUSSION_POST', 'MEETING_SCHEDULE'
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'TeamCRM Core Platform',
    keyCode: 'CRM',
    description: 'Integrated corporate CRM, Jira-lite tasks, server-side time tracking and API handoff.',
    status: 'ACTIVE',
    ownerId: 1,
    ownerName: 'Payal Jadhao',
    managerIds: [3],
    employeeIds: [4],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Enterprise Mobile App',
    keyCode: 'MOB',
    description: 'Cross-platform iOS and Android mobile app for field enterprise agents.',
    status: 'ACTIVE',
    ownerId: 1,
    ownerName: 'Payal Jadhao',
    managerIds: [3],
    employeeIds: [4],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'AI Analytics & Automation',
    keyCode: 'AI',
    description: 'Predictive sales analytics, pipeline forecasting and lead scoring ML pipeline.',
    status: 'ACTIVE',
    ownerId: 1,
    ownerName: 'Payal Jadhao',
    managerIds: [3],
    employeeIds: [4],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ALL_PERMISSIONS = [
  { id: 1, code: 'ROLE_ADMIN', module: 'ADMIN', description: 'Full Superadmin system control' },
  { id: 2, code: 'USER_CREATE', module: 'USER', description: 'Create and provision new employees' },
  { id: 3, code: 'USER_EDIT', module: 'USER', description: 'Edit existing user profiles' },
  { id: 4, code: 'USER_DEACTIVATE', module: 'USER', description: 'Deactivate or suspend user accounts' },
  { id: 5, code: 'ROLE_MANAGE', module: 'USER', description: 'Assign roles and fine-grained permissions' },
  { id: 6, code: 'PROJECT_CREATE', module: 'PROJECT', description: 'Create new project boards' },
  { id: 7, code: 'PROJECT_EDIT', module: 'PROJECT', description: 'Modify project configurations' },
  { id: 8, code: 'TASK_CREATE', module: 'TASK', description: 'Create sprint tasks and stories' },
  { id: 9, code: 'TASK_ASSIGN', module: 'TASK', description: 'Assign tasks to team members' },
  { id: 10, code: 'TASK_EDIT', module: 'TASK', description: 'Edit task details and statuses' },
  { id: 11, code: 'TASK_DELETE', module: 'TASK', description: 'Delete tasks and sub-tasks' },
  { id: 12, code: 'TIME_TRACK', module: 'TIME', description: 'Start and stop server time tracking' },
  { id: 13, code: 'TIME_EDIT_MANUAL', module: 'TIME', description: 'Submit manual time entries' },
  { id: 14, code: 'CHECKLIST_MANAGE', module: 'TASK', description: 'Manage task checklist items' },
  { id: 15, code: 'DISCUSSION_POST', module: 'DISCUSSION', description: 'Post discussions and query blockers' },
  { id: 16, code: 'DISCUSSION_MENTION_ALL', module: 'DISCUSSION', description: 'Tag entire team channels' },
  { id: 17, code: 'DISCUSSION_MODERATE', module: 'DISCUSSION', description: 'Resolve and moderate blocker queries' },
  { id: 18, code: 'API_DOC_PUBLISH', module: 'API', description: 'Publish OpenAPI documentation handoffs' },
  { id: 19, code: 'API_DOC_REVIEW', module: 'API', description: 'Review and approve backend API contracts' },
  { id: 20, code: 'MEETING_SCHEDULE', module: 'MEETING', description: 'Schedule team standups and syncs' },
  { id: 21, code: 'MEETING_EDIT_NOTES', module: 'MEETING', description: 'Record meeting action items and minutes' },
  { id: 22, code: 'LEAD_VIEW_ALL', module: 'CRM', description: 'View full sales pipeline leads' },
  { id: 23, code: 'LEAD_MANAGE', module: 'CRM', description: 'Create and qualify CRM leads' },
  { id: 24, code: 'DEAL_MANAGE', module: 'CRM', description: 'Advance deals across pipeline stages' },
  { id: 25, code: 'REPORT_VIEW', module: 'REPORT', description: 'Access executive analytics and reports' },
  { id: 26, code: 'AUDIT_VIEW', module: 'AUDIT', description: 'Inspect tamper-proof audit trails' }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 101,
    projectId: 1,
    projectName: 'TeamCRM Core Platform',
    taskCode: 'CRM-101',
    title: 'Finalize OAuth2 Google Sign-in flow and RBAC',
    type: 'FEATURE',
    priority: 'HIGH',
    status: 'DONE',
    assigneeId: 1,
    assigneeName: 'Payal Jadhao',
    assigneeTeam: 'MANAGEMENT',
    reporterName: 'Payal Jadhao',
    dueDate: '2026-10-20',
    estimatedHours: 6,
    checklistMustBeCompleted: true,
    totalLoggedSeconds: 14400,
    checklistTotal: 2,
    checklistCompleted: 2,
    isTimerRunning: false
  },
  {
    id: 102,
    projectId: 1,
    projectName: 'TeamCRM Core Platform',
    taskCode: 'CRM-102',
    title: 'Integrate Server-Side Anti-Tamper Time Tracker',
    type: 'FEATURE',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    assigneeId: 4,
    assigneeName: 'Rahaa Malhotra',
    assigneeTeam: 'FRONTEND',
    reporterName: 'Payal Jadhao',
    dueDate: '2026-10-22',
    estimatedHours: 12,
    checklistMustBeCompleted: true,
    totalLoggedSeconds: 7200,
    checklistTotal: 3,
    checklistCompleted: 1,
    isTimerRunning: true
  },
  {
    id: 103,
    projectId: 1,
    projectName: 'TeamCRM Core Platform',
    taskCode: 'CRM-103',
    title: 'Audit Trail and Compliance Export Service',
    type: 'FEATURE',
    priority: 'MEDIUM',
    status: 'REVIEW',
    assigneeId: 3,
    assigneeName: 'Jayshree Jadhao',
    assigneeTeam: 'FRONTEND',
    reporterName: 'Payal Jadhao',
    dueDate: '2026-10-25',
    estimatedHours: 8,
    checklistMustBeCompleted: false,
    totalLoggedSeconds: 3600,
    checklistTotal: 1,
    checklistCompleted: 0,
    isTimerRunning: false
  },
  {
    id: 104,
    projectId: 1,
    projectName: 'TeamCRM Core Platform',
    taskCode: 'CRM-104',
    title: 'OpenAPI Specification and Postman Collection sync',
    type: 'CHORE',
    priority: 'LOW',
    status: 'TODO',
    assigneeId: 4,
    assigneeName: 'Rahaa Malhotra',
    assigneeTeam: 'FRONTEND',
    reporterName: 'Payal Jadhao',
    dueDate: '2026-10-30',
    estimatedHours: 4,
    checklistMustBeCompleted: false,
    totalLoggedSeconds: 0,
    checklistTotal: 0,
    checklistCompleted: 0,
    isTimerRunning: false
  }
];

const INITIAL_DEALS: Deal[] = [
  {
    id: 1,
    title: 'Apex Global CRM Enterprise Rollout',
    dealValue: 36000,
    currency: 'USD',
    stage: 'NEGOTIATION',
    expectedCloseDate: '2026-11-15',
    assignedToId: 1,
    assignedToName: 'Payal Jadhao',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 1,
    firstName: 'Vikram',
    lastName: 'Sengupta',
    email: 'vikram.s@apextech.io',
    company: 'Apex Technologies',
    status: 'CONTACTED',
    source: 'LINKEDIN',
    assignedToId: 1,
    assignedToName: 'Payal Jadhao',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    companyName: 'Apex Technologies',
    primaryContactName: 'Vikram Sengupta',
    primaryContactEmail: 'vikram.s@apextech.io',
    primaryContactPhone: '+91 98200 12345',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 1,
    title: 'Sprint Architecture & Handoff Sync',
    agenda: 'Review anti-tamper time engine and deployment strategy',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
    durationMinutes: 60,
    status: 'SCHEDULED',
    meetingLink: 'https://meet.google.com/crm-team-sync',
    organizerId: 1,
    organizerName: 'Payal Jadhao',
    attendeeNames: ['Payal Jadhao', 'Jayshree Jadhao', 'Rahaa Malhotra'],
    createdAt: new Date().toISOString()
  }
];

const INITIAL_AUDIT: AuditLogItem[] = [
  {
    id: 1,
    action: 'USER_LOGIN',
    entityName: 'User',
    entityId: '1',
    actorId: 1,
    actorEmail: 'payaldj2709@gmail.com',
    newValue: 'User authenticated via TeamCRM enterprise session',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    action: 'TASK_STATUS_CHANGE',
    entityName: 'Task',
    entityId: '102',
    actorId: 4,
    actorEmail: 'rahaamalhotra@gmail.com',
    newValue: 'Status advanced from TODO to IN_PROGRESS',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const memoryStore = new Map<string, any>();

// Purge any legacy business data keys from localStorage on startup
if (typeof window !== 'undefined') {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('teamcrm_store_')) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

function getStored<T>(key: string, defaultValue: T): T {
  if (!memoryStore.has(key)) {
    memoryStore.set(key, defaultValue);
    return defaultValue;
  }
  return memoryStore.get(key);
}

function setStored<T>(key: string, val: T): void {
  memoryStore.set(key, val);
}

export const mockStore = {
  getUsers: (): User[] => {
    let users = getStored<User[]>('teamcrm_store_users', INITIAL_USERS);
    // Enforce invariant: only payaldjadhao@gmail.com is ROLE_ADMIN
    let modified = false;

    // Purge any rogue user created by previous Google OAuth auto-create bug
    const beforeCount = users.length;
    users = users.filter((u) => u.email.toLowerCase().trim() !== 'payaljadhao2709@gmail.com');
    if (users.length !== beforeCount) {
      modified = true;
    }

    users = users.map((u) => {
      if (u.email.toLowerCase() === 'payaldjadhao@gmail.com') {
        if (u.roleName !== 'ROLE_ADMIN') {
          u.roleName = 'ROLE_ADMIN';
          (u as any).role = 'ROLE_ADMIN';
          modified = true;
        }
      } else if (u.roleName === 'ROLE_ADMIN') {
        u.roleName = 'ROLE_EMPLOYEE';
        (u as any).role = 'ROLE_EMPLOYEE';
        modified = true;
      }
      return u;
    });

    // Ensure core role users (Admin, Manager, Employee) always exist
    for (const initU of INITIAL_USERS) {
      if (!users.some((u) => u.email.toLowerCase() === initU.email.toLowerCase())) {
        users.push(initU);
        modified = true;
      }
    }

    if (modified) {
      setStored('teamcrm_store_users', users);
    }
    return users;
  },

  createUser: (data: {
    email: string;
    fullName: string;
    roleName: string;
    teamTag?: string;
    tempPassword?: string;
    phone?: string;
    extraPermissions?: string[];
  }): User => {
    const users = mockStore.getUsers();
    const cleanEmail = data.email.toLowerCase().trim();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email is already registered');
    }
    const safeRole = data.roleName === 'ROLE_MANAGER' ? 'ROLE_MANAGER' : 'ROLE_EMPLOYEE';
    const newUser: User = {
      id: Date.now(),
      email: cleanEmail,
      fullName: data.fullName,
      roleName: safeRole as any,
      teamTag: (data.teamTag as any) || 'FRONTEND',
      phone: data.phone || '',
      isActive: true,
      isFirstLogin: true,
      initialPassword: data.tempPassword || 'Pass@123',
      permissions: data.extraPermissions || [safeRole, 'TASK_CREATE', 'TASK_EDIT', 'TIME_TRACK']
    };
    (newUser as any).role = safeRole;
    users.push(newUser);
    setStored('teamcrm_store_users', users);
    return newUser;
  },

  updateUser: (id: number, data: any): User => {
    const users = mockStore.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      if (data.password) {
        data.initialPassword = data.password;
      }
      users[idx] = { ...users[idx], ...data };
      setStored('teamcrm_store_users', users);
      return users[idx];
    }
    return data;
  },

  deleteUser: (id: number): void => {
    const users = mockStore.getUsers().filter((u) => u.id !== id);
    setStored('teamcrm_store_users', users);
  },

  toggleStatus: (id: number): void => {
    const users = mockStore.getUsers();
    const user = users.find((u) => u.id === id);
    if (user) {
      user.isActive = !user.isActive;
      setStored('teamcrm_store_users', users);
    }
  },

  getAllPermissions: () => ALL_PERMISSIONS,

  getProjects: (): Project[] => {
    return getStored<Project[]>('teamcrm_store_projects', INITIAL_PROJECTS);
  },

  createProject: (data: Partial<Project> & { managerIds?: number[]; employeeIds?: number[] }): Project => {
    const projects = mockStore.getProjects();
    const newId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    const newProj: Project = {
      id: newId,
      name: data.name || 'New Project',
      keyCode: (data.keyCode || 'PRJ').toUpperCase().trim(),
      description: data.description || '',
      status: (data.status as any) || 'ACTIVE',
      ownerId: 1,
      ownerName: 'Payal Jadhao',
      managerIds: data.managerIds || [3],
      employeeIds: data.employeeIds || [4],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(newProj);
    setStored('teamcrm_store_projects', projects);
    return newProj;
  },

  updateProject: (id: number, data: Partial<Project> & { managerIds?: number[]; employeeIds?: number[] }): Project => {
    const projects = mockStore.getProjects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      projects[idx] = {
        ...projects[idx],
        ...data,
        managerIds: data.managerIds !== undefined ? data.managerIds : projects[idx].managerIds,
        employeeIds: data.employeeIds !== undefined ? data.employeeIds : projects[idx].employeeIds,
        updatedAt: new Date().toISOString(),
      };
      setStored('teamcrm_store_projects', projects);
      return projects[idx];
    }
    throw new Error('Project not found');
  },

  deleteProject: (id: number): void => {
    const projects = mockStore.getProjects().filter((p) => p.id !== id);
    setStored('teamcrm_store_projects', projects);
  },

  getTasks: (params?: any): Task[] => {
    let tasks = getStored<Task[]>('teamcrm_store_tasks', INITIAL_TASKS);
    if (params?.status) {
      tasks = tasks.filter((t) => t.status === params.status);
    }
    if (params?.projectId && params.projectId !== 'ALL') {
      tasks = tasks.filter((t) => t.projectId === Number(params.projectId));
    }
    return tasks;
  },

  getTaskById: (id: number): Task => {
    const tasks = mockStore.getTasks();
    const task = tasks.find((t) => t.id === id);
    return task || tasks[0];
  },

  createTask: (data: any): Task => {
    const tasks = mockStore.getTasks();
    const projects = mockStore.getProjects();
    const assignedProject = projects.find((p) => p.id === Number(data.projectId)) || projects[0];
    const projectKeyCode = assignedProject ? assignedProject.keyCode : 'CRM';
    const newTask: Task = {
      id: Date.now(),
      projectId: assignedProject?.id || 1,
      projectName: assignedProject?.name || 'TeamCRM Core Platform',
      taskCode: `${projectKeyCode}-${tasks.length + 101}`,
      title: data.title || 'Untitled Task',
      description: data.description || '',
      type: data.type || 'FEATURE',
      priority: data.priority || 'MEDIUM',
      status: data.status || 'TODO',
      assigneeId: data.assigneeId || 1,
      assigneeName: data.assigneeName || 'Payal Jadhao',
      assigneeTeam: data.assigneeTeam || 'MANAGEMENT',
      assigneeIds: data.assigneeIds,
      assigneeNames: data.assigneeNames,
      reporterName: 'Payal Jadhao',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      estimatedHours: data.estimatedHours || 4,
      checklistMustBeCompleted: Boolean(data.checklistMustBeCompleted),
      totalLoggedSeconds: 0,
      checklistTotal: 0,
      checklistCompleted: 0,
      isTimerRunning: false
    };
    tasks.unshift(newTask);
    setStored('teamcrm_store_tasks', tasks);
    return newTask;
  },

  updateTaskStatus: (id: number, status: string): Task => {
    const tasks = mockStore.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.status = status as any;
      setStored('teamcrm_store_tasks', tasks);
      return task;
    }
    return tasks[0];
  },

  updateTask: (id: number, data: any): Task => {
    const tasks = mockStore.getTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...data };
      setStored('teamcrm_store_tasks', tasks);
      return tasks[idx];
    }
    return data;
  },

  deleteTask: (id: number): void => {
    const tasks = mockStore.getTasks().filter((t) => t.id !== id);
    setStored('teamcrm_store_tasks', tasks);
  },

  getChecklist: (taskId: number): ChecklistItem[] => {
    const all = getStored<Record<number, ChecklistItem[]>>('teamcrm_store_checklists', {
      102: [
        { id: 1, taskId: 102, text: 'Validate WebSocket heartbeat channel', isDone: true, position: 0 },
        { id: 2, taskId: 102, text: 'Configure auto-pause after 15m idle time', isDone: false, position: 1 }
      ]
    });
    return all[taskId] || [];
  },

  addChecklistItem: (taskId: number, text: string): ChecklistItem => {
    const all = getStored<Record<number, ChecklistItem[]>>('teamcrm_store_checklists', {});
    const list = all[taskId] || [];
    const item: ChecklistItem = {
      id: Date.now(),
      taskId,
      text,
      isDone: false,
      position: list.length
    };
    list.push(item);
    all[taskId] = list;
    setStored('teamcrm_store_checklists', all);
    return item;
  },

  toggleChecklistItem: (itemId: number): ChecklistItem => {
    const all = getStored<Record<number, ChecklistItem[]>>('teamcrm_store_checklists', {});
    let updated: ChecklistItem | null = null;
    for (const tid in all) {
      const found = all[tid].find((item) => item.id === itemId);
      if (found) {
        found.isDone = !found.isDone;
        updated = found;
        break;
      }
    }
    setStored('teamcrm_store_checklists', all);
    return updated || { id: itemId, taskId: 1, text: '', isDone: true, position: 0 };
  },

  deleteChecklistItem: (itemId: number): void => {
    const all = getStored<Record<number, ChecklistItem[]>>('teamcrm_store_checklists', {});
    for (const tid in all) {
      all[tid] = all[tid].filter((i) => i.id !== itemId);
    }
    setStored('teamcrm_store_checklists', all);
  },

  getActiveTimer: (): RunningTimer | null => {
    return getStored<RunningTimer | null>('teamcrm_store_active_timer', null);
  },

  startTimer: (taskId: number, note?: string): RunningTimer => {
    const timer: RunningTimer = {
      logId: Date.now(),
      taskId,
      taskCode: 'CRM-' + taskId,
      taskTitle: 'Active Sprint Item',
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
      note: note || ''
    };
    setStored('teamcrm_store_active_timer', timer);
    return timer;
  },

  stopTimer: (note?: string): TimeLog => {
    const active = mockStore.getActiveTimer();
    const duration = active ? Math.max(60, Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000)) : 1800;
    const log: TimeLog = {
      id: Date.now(),
      taskId: active?.taskId || 101,
      taskCode: active?.taskCode || 'CRM-101',
      taskTitle: active?.taskTitle || 'Sprint Item',
      userId: 1,
      userName: 'Payal Jadhao',
      durationSeconds: duration,
      startTime: active?.startTime || new Date(Date.now() - duration * 1000).toISOString(),
      endTime: new Date().toISOString(),
      source: 'TIMER',
      note: note || active?.note || 'Sprint execution'
    };
    const logs = mockStore.getMyLogs();
    logs.unshift(log);
    setStored('teamcrm_store_time_logs', logs);
    setStored('teamcrm_store_active_timer', null);
    return log;
  },

  getMyLogs: (): TimeLog[] => {
    return getStored<TimeLog[]>('teamcrm_store_time_logs', [
      {
        id: 1,
        taskId: 101,
        taskCode: 'CRM-101',
        taskTitle: 'Finalize OAuth2 Google Sign-in flow and RBAC',
        userId: 1,
        userName: 'Payal Jadhao',
        durationSeconds: 14400,
        startTime: new Date(Date.now() - 14400000).toISOString(),
        endTime: new Date().toISOString(),
        source: 'MANUAL',
        note: 'Completed OAuth2 & Role badges deployment'
      }
    ]);
  },

  getComments: (_taskId: number): TaskComment[] => {
    return getStored<TaskComment[]>('teamcrm_store_comments', [
      {
        id: 1,
        taskId: 102,
        authorId: 1,
        authorName: 'Payal Jadhao',
        type: 'QUERY',
        body: 'Do we have WebSocket failover configured on the load balancer?',
        status: 'RESOLVED',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]);
  },

  postComment: (taskId: number, body: string, type: string = 'GENERAL'): TaskComment => {
    const comments = mockStore.getComments(taskId);
    const comment: TaskComment = {
      id: Date.now(),
      taskId,
      authorId: 1,
      authorName: 'Payal Jadhao',
      type: type as any,
      body,
      status: type === 'QUERY' ? 'OPEN' : 'RESOLVED',
      createdAt: new Date().toISOString()
    };
    comments.push(comment);
    setStored('teamcrm_store_comments', comments);
    return comment;
  },

  getApiDocs: (): ApiDoc[] => {
    return getStored<ApiDoc[]>('teamcrm_store_api_docs', [
      {
        id: 1,
        title: 'Auth & OAuth2 API Specification',
        version: 'v1.2',
        status: 'INTEGRATED',
        httpMethod: 'POST',
        endpoint: '/api/v1/auth/login',
        environment: 'PROD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
  },

  createApiDoc: (doc: any): ApiDoc => {
    const docs = mockStore.getApiDocs();
    const newDoc: any = {
      id: Date.now(),
      title: doc.title || 'New API Spec',
      httpMethod: doc.httpMethod || 'POST',
      endpoint: doc.endpoint || '/api/v1/',
      status: doc.status || 'READY_FOR_INTEGRATION',
      version: doc.version || 'v1.0.0',
      environment: doc.environment || 'DEV',
      authRequired: doc.authRequired || 'Bearer JWT',
      taskId: doc.taskId,
      requestBodyJson: doc.requestBodyJson,
      responseBodyJson: doc.responseBodyJson,
      taggedUserIds: doc.taggedUserIds || [],
      taggedUserNames: doc.taggedUserNames || [],
      taggedUserEmails: doc.taggedUserEmails || [],
      comments: [],
      createdById: doc.createdById || 1,
      createdByName: doc.createdByName || 'Payal Jadhao',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    setStored('teamcrm_store_api_docs', docs);
    return newDoc;
  },

  addApiComment: (apiDocId: number, comment: any): any => {
    const docs = mockStore.getApiDocs();
    const doc: any = docs.find((d: any) => d.id === apiDocId);
    if (doc) {
      if (!doc.comments) doc.comments = [];
      const newComment = {
        id: Date.now(),
        authorName: comment.authorName || 'Team Member',
        authorRole: comment.authorRole || 'EMPLOYEE',
        text: comment.text,
        createdAt: new Date().toISOString(),
      };
      doc.comments.push(newComment);
      setStored('teamcrm_store_api_docs', docs);
      return newComment;
    }
    return null;
  },

  getMeetings: (): Meeting[] => {
    return getStored<Meeting[]>('teamcrm_store_meetings', INITIAL_MEETINGS);
  },

  getLeads: (): Lead[] => {
    return getStored<Lead[]>('teamcrm_store_leads', INITIAL_LEADS);
  },

  getCustomers: (): Customer[] => {
    return getStored<Customer[]>('teamcrm_store_customers', INITIAL_CUSTOMERS);
  },

  getDeals: (): Deal[] => {
    return getStored<Deal[]>('teamcrm_store_deals', INITIAL_DEALS);
  },

  getManagerDashboard: (): ManagerDashboard => {
    const tasks = mockStore.getTasks();
    const users = mockStore.getUsers();
    return {
      totalProjects: 3,
      totalTasks: tasks.length,
      inProgressTasks: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      blockedTasks: 0,
      openQueries: 0,
      totalPipelineRevenue: mockStore.getDeals().reduce((acc, d) => acc + (d.dealValue || 0), 0),
      wonDealsCount: 0,
      totalLeads: mockStore.getLeads().length,
      teamWorkload: users.map((u) => ({
        name: u.fullName,
        tasks: tasks.filter((t) => t.assigneeId === u.id || t.assigneeName === u.fullName).length
      })),
      dealsByStage: [
        { stage: 'NEGOTIATION', count: 1 }
      ],
      recentActivity: [
        {
          id: 1,
          action: 'STATUS_CHANGE',
          entityName: 'Task',
          actorEmail: 'payaldj2709@gmail.com',
          newValue: 'IN_PROGRESS',
          createdAt: new Date().toISOString()
        }
      ]
    };
  },

  getEmployeeDashboard: (): EmployeeDashboard => {
    const tasks = mockStore.getTasks();
    return {
      myPendingTasksCount: tasks.filter((t) => t.status !== 'DONE').length,
      myDoneTasksCount: tasks.filter((t) => t.status === 'DONE').length,
      myTotalHoursLoggedSeconds: 14400,
      unreadNotificationsCount: 1,
      myActiveTasks: tasks.filter((t) => t.status !== 'DONE'),
      activeTimer: mockStore.getActiveTimer(),
      upcomingMeetings: mockStore.getMeetings()
    };
  },

  getNotifications: (): NotificationItem[] => {
    return getStored<NotificationItem[]>('teamcrm_store_notifications', [
      {
        id: 1,
        recipient: INITIAL_USERS[0],
        title: 'Welcome to TeamCRM',
        message: 'Your workspace is fully connected with Admin permissions.',
        type: 'SYSTEM',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ]);
  },

  getAuditLogs: (): AuditLogItem[] => {
    return getStored<AuditLogItem[]>('teamcrm_store_audit', INITIAL_AUDIT);
  }
};
