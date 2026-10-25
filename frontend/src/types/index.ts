export type RoleName = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';
export type TeamTag = 'FRONTEND' | 'BACKEND' | 'QA' | 'SALES' | 'DESIGN' | 'MANAGEMENT' | 'GENERAL';

export interface User {
  id: number;
  email: string;
  fullName: string;
  roleName: RoleName;
  teamTag?: TeamTag;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isFirstLogin: boolean;
  permissions: string[];
  initialPassword?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: RoleName;
  teamTag?: TeamTag;
  isFirstLogin: boolean;
  permissions: string[];
}

export interface Project {
  id: number;
  name: string;
  keyCode: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  ownerId?: number;
  ownerName?: string;
  managerIds: number[];
  employeeIds: number[];
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'FEATURE' | 'BUG' | 'QUERY' | 'CHORE';

export interface Task {
  id: number;
  projectId?: number;
  projectName?: string;
  taskCode: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: number;
  assigneeName?: string;
  assigneeTeam?: string;
  assigneeIds?: string;
  assigneeNames?: string;
  reporterId?: number;
  reporterName?: string;
  dueDate?: string;
  estimatedHours?: number;
  labels?: string;
  linkedLeadId?: number;
  linkedLeadName?: string;
  linkedCustomerId?: number;
  linkedCustomerName?: string;
  linkedDealId?: number;
  linkedDealTitle?: string;
  checklistMustBeCompleted: boolean;
  totalLoggedSeconds: number;
  checklistTotal: number;
  checklistCompleted: number;
  isTimerRunning: boolean;
  createdAt?: string;
  assignedAt?: string;
  firstStartedAt?: string;
}

export interface ChecklistItem {
  id: number;
  taskId: number;
  text: string;
  isDone: boolean;
  position: number;
  doneById?: number;
  doneByName?: string;
  doneAt?: string;
}

export interface TimeLog {
  id: number;
  taskId: number;
  taskCode: string;
  taskTitle: string;
  userId: number;
  userName: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  note?: string;
  source: 'TIMER' | 'MANUAL' | 'AUTO_STOPPED';
}

export interface RunningTimer {
  logId: number;
  taskId: number;
  taskCode: string;
  taskTitle: string;
  startTime: string;
  elapsedSeconds: number;
  note?: string;
  accumulatedSeconds?: number;
}

export interface TaskComment {
  id: number;
  taskId: number;
  authorId: number;
  authorName: string;
  authorTeam?: string;
  authorAvatar?: string;
  type: 'QUERY' | 'BLOCKER' | 'UPDATE' | 'GENERAL';
  body: string;
  parentId?: number;
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED';
  createdAt: string;
}

export type ApiDocStatus = 'DRAFT' | 'READY_FOR_INTEGRATION' | 'INTEGRATING' | 'INTEGRATED' | 'CHANGE_REQUESTED';

export interface ApiDocComment {
  id: number;
  apiDocId: number;
  authorId?: number;
  authorName: string;
  authorRole?: string;
  text: string;
  createdAt: string;
}

export interface ApiDoc {
  id: number;
  projectId?: number;
  projectName?: string;
  taskId?: number;
  taskCode?: string;
  taskTitle?: string;
  title: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  status: ApiDocStatus;
  version: string;
  environment: 'DEV' | 'STAGING' | 'PROD';
  authRequired?: string;
  errorCodes?: string;
  swaggerUrl?: string;
  postmanUrl?: string;
  requestBodyJson?: string;
  responseBodyJson?: string;
  changeNotes?: string;
  createdById?: number;
  createdByName?: string;
  taggedUserIds?: number[];
  taggedUserNames?: string[];
  taggedUserEmails?: string[];
  comments?: ApiDocComment[];
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: number;
  title: string;
  agenda?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  meetingLink?: string;
  location?: string;
  status: string;
  linkedTaskId?: number;
  linkedTaskTitle?: string;
  organizerId: number;
  organizerName: string;
  attendeeNames: string[];
  notes?: string;
  actionItemsJson?: string;
  createdAt: string;
}

export interface Lead {
  id: number;
  firstName: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST';
  source?: string;
  notes?: string;
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  companyName: string;
  industry?: string;
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  address?: string;
  accountManagerId?: number;
  accountManagerName?: string;
  assignedUserIds?: number[];
  assignedUserNames?: string[];
  createdAt: string;
}

export interface Deal {
  id: number;
  title: string;
  customerId?: number;
  customerName?: string;
  leadId?: number;
  leadName?: string;
  stage: 'PROSPECT' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  dealValue: number;
  currency: string;
  expectedCloseDate?: string;
  assignedToId?: number;
  assignedToName?: string;
  assignedUserIds?: number[];
  assignedUserNames?: string[];
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  recipient: User;
  sender?: User;
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface ManagerDashboard {
  totalProjects: number;
  totalTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  openQueries: number;
  totalPipelineRevenue: number;
  wonDealsCount: number;
  totalLeads: number;
  teamWorkload: { name: string; tasks: number }[];
  dealsByStage: { stage: string; count: number }[];
  recentActivity: { id: number; action: string; entityName: string; actorEmail: string; newValue: string; createdAt: string }[];
}

export interface EmployeeDashboard {
  myPendingTasksCount: number;
  myDoneTasksCount: number;
  myTotalHoursLoggedSeconds: number;
  unreadNotificationsCount: number;
  myActiveTasks: Task[];
  activeTimer: RunningTimer | null;
  upcomingMeetings: Meeting[];
}

export interface AdminDashboard {
  totalPipelineRevenue: number;
  closedWonMonth: number;
  activeSprintTasks: number;
  totalSprintTasks: number;
  blockedTasks: number;
  totalLeads: number;
  activeUsersCount: number;
  adminCount: number;
  managerCount: number;
  employeeCount: number;
  teamWorkload: { name: string; tasks: number }[];
  dealsByStage: { stage: string; count: number }[];
  estimatedHours: number;
  actualHours: number;
  varianceHours: number;
  overdueTasks: number;
  activeTimers: number;
  pendingLeaves: number;
  recentActivity: { id: number; action: string; entityName: string; actorEmail: string; newValue: string; createdAt: string }[];
}

export interface MasterItem {
  id: number;
  category: 'TEAM' | 'TASK_TYPE' | 'LEAD_STATUS' | 'DEAL_STAGE';
  name: string;
  keyCode?: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface AuditLogItem {
  id: number;
  actorId?: number;
  actorEmail?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
}

