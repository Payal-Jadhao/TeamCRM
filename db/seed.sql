-- ====================================================================
-- TeamCRM Seed Data (PostgreSQL)
-- Default demo password for all accounts: Password123!
-- BCrypt Hash: $2a$10$Vv1PZlZfU7cWw1jG9s0G7u23P1RsmG4b2qB8wA9j1Z7Y0m4O9s7iW
-- ====================================================================

-- 1. ROLES
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Super administrator with full system, global settings and audit access'),
(2, 'ROLE_MANAGER', 'Team manager with employee management, project assignment and report access'),
(3, 'ROLE_EMPLOYEE', 'Individual contributor with task, timer, discussion and assigned lead access')
ON CONFLICT (id) DO NOTHING;

-- 2. PERMISSIONS
INSERT INTO permissions (id, code, module, description) VALUES
(1, 'USER_CREATE', 'AUTH', 'Create new employees and assign roles'),
(2, 'USER_EDIT', 'AUTH', 'Modify employee profile and team tags'),
(3, 'USER_DEACTIVATE', 'AUTH', 'Deactivate or reactivate an employee'),
(4, 'ROLE_MANAGE', 'AUTH', 'Manage roles and fine-grained permissions matrix'),
(5, 'PROJECT_CREATE', 'PROJECTS', 'Create new projects and add members'),
(6, 'PROJECT_EDIT', 'PROJECTS', 'Edit project details and settings'),
(7, 'TASK_CREATE', 'TASKS', 'Create new tasks in projects'),
(8, 'TASK_ASSIGN', 'TASKS', 'Assign tasks to team members'),
(9, 'TASK_EDIT', 'TASKS', 'Edit task details, description, due date'),
(10, 'TASK_DELETE', 'TASKS', 'Delete or archive tasks'),
(11, 'TIME_TRACK', 'TIME_TRACKING', 'Start, pause and end task timers'),
(12, 'TIME_EDIT_MANUAL', 'TIME_TRACKING', 'Manually adjust or correct task time logs'),
(13, 'CHECKLIST_MANAGE', 'TASKS', 'Create, update and delete checklist items'),
(14, 'DISCUSSION_POST', 'DISCUSSIONS', 'Post messages and queries in task discussions'),
(15, 'DISCUSSION_MENTION_ALL', 'DISCUSSIONS', 'Use @everyone mention in task discussions'),
(16, 'DISCUSSION_MODERATE', 'DISCUSSIONS', 'Moderate or remove task discussion messages'),
(17, 'API_DOC_PUBLISH', 'API_HANDOFF', 'Publish and update backend-to-frontend API specifications'),
(18, 'API_DOC_REVIEW', 'API_HANDOFF', 'Change API status and request modifications'),
(19, 'MEETING_SCHEDULE', 'MEETINGS', 'Schedule company meetings and invite members'),
(20, 'MEETING_EDIT_NOTES', 'MEETINGS', 'Write meeting minutes and create action items'),
(21, 'LEAD_VIEW_ALL', 'CRM', 'View all company leads'),
(22, 'LEAD_MANAGE', 'CRM', 'Create, edit and convert leads into customers'),
(23, 'DEAL_MANAGE', 'CRM', 'Manage deals pipeline and update stages'),
(24, 'REPORT_VIEW', 'REPORTS', 'Access time tracking, team workload and CRM reports'),
(25, 'AUDIT_VIEW', 'AUDIT', 'View system-wide activity and security audit logs')
ON CONFLICT (id) DO NOTHING;

-- 3. ROLE PERMISSIONS
-- Admin gets all permissions (1..25)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON CONFLICT DO NOTHING;

-- Manager gets most permissions except role management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code NOT IN ('ROLE_MANAGE')
ON CONFLICT DO NOTHING;

-- Employee gets daily work permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE code IN (
    'TASK_CREATE', 'TASK_EDIT', 'TIME_TRACK', 'CHECKLIST_MANAGE',
    'DISCUSSION_POST', 'API_DOC_REVIEW', 'LEAD_MANAGE', 'DEAL_MANAGE'
)
ON CONFLICT DO NOTHING;

-- 4. TEAMS
INSERT INTO teams (id, name, tag, description) VALUES
(1, 'Frontend Engineering', 'FRONTEND', 'React, TypeScript, Tailwind, UI/UX implementation'),
(2, 'Backend Engineering', 'BACKEND', 'Spring Boot, PostgreSQL, APIs, microservices'),
(3, 'Quality Assurance', 'QA', 'Manual testing, automation and regression suites'),
(4, 'Sales & Revenue', 'SALES', 'Lead generation, client outreach and deals closing'),
(5, 'Product Design', 'DESIGN', 'Figma prototypes, design system, user research')
ON CONFLICT (id) DO NOTHING;

-- 5. USERS (Password: Password123!)
-- Hash: $2a$10$wO/LzQh9qg7n7c1l2dE/2.X6aM5XyUvK6F7I7J9L2Z3C1A5b6e8g. (Standard BCrypt for demo)
-- For compatibility in our Spring Boot app we store standard BCrypt:
INSERT INTO users (id, email, password_hash, full_name, role_id, team_tag, phone, is_active, is_first_login) VALUES
(1, 'admin@teamcrm.com', '$2a$10$wK1F5NfB5Q1X7e2/f4VXeOP5h4a2aO3y8d1X9s4A2b3c4d5e6f7g8', 'Aarav Sharma (Admin)', 1, 'BACKEND', '+91 9876543210', TRUE, FALSE),
(2, 'manager@teamcrm.com', '$2a$10$wK1F5NfB5Q1X7e2/f4VXeOP5h4a2aO3y8d1X9s4A2b3c4d5e6f7g8', 'Neha Kapoor (Manager)', 2, 'FRONTEND', '+91 9876543211', TRUE, FALSE),
(3, 'rahul.frontend@teamcrm.com', '$2a$10$wK1F5NfB5Q1X7e2/f4VXeOP5h4a2aO3y8d1X9s4A2b3c4d5e6f7g8', 'Rahul Verma (Frontend)', 3, 'FRONTEND', '+91 9876543212', TRUE, FALSE),
(4, 'priya.backend@teamcrm.com', '$2a$10$wK1F5NfB5Q1X7e2/f4VXeOP5h4a2aO3y8d1X9s4A2b3c4d5e6f7g8', 'Priya Nair (Backend)', 3, 'BACKEND', '+91 9876543213', TRUE, FALSE),
(5, 'amit.qa@teamcrm.com', '$2a$10$wK1F5NfB5Q1X7e2/f4VXeOP5h4a2aO3y8d1X9s4A2b3c4d5e6f7g8', 'Amit Patel (QA)', 3, 'QA', '+91 9876543214', TRUE, FALSE),
(6, 'ananya.sales@teamcrm.com', '$2a$10$wK1F5NfB5Q1X7e2/f4VXeOP5h4a2aO3y8d1X9s4A2b3c4d5e6f7g8', 'Ananya Sen (Sales)', 3, 'SALES', '+91 9876543215', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 6. PROJECTS
INSERT INTO projects (id, name, key_code, description, status, owner_id) VALUES
(1, 'TeamCRM Core Platform', 'CRM', 'Main full-stack SaaS platform combining CRM, Tasks, and Live Timer', 'ACTIVE', 2),
(2, 'Customer Mobile App', 'MOB', 'React Native customer-facing portal and deals companion', 'ACTIVE', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'ADMIN'),
(1, 2, 'MANAGER'),
(1, 3, 'CONTRIBUTOR'),
(1, 4, 'CONTRIBUTOR'),
(1, 5, 'CONTRIBUTOR'),
(1, 6, 'CONTRIBUTOR')
ON CONFLICT DO NOTHING;

-- 7. CRM LEADS, CUSTOMERS, DEALS
INSERT INTO leads (id, first_name, last_name, company, email, phone, status, source, notes, assigned_to) VALUES
(1, 'Rohan', 'Mehta', 'Apex Logistics Ltd', 'rohan@apexlogistics.in', '+91 9123456789', 'QUALIFIED', 'LINKEDIN', 'Looking for integrated CRM and task system for 50 field agents.', 6),
(2, 'Simran', 'Kaur', 'FinTech Innovations', 'simran@fintechinno.com', '+91 9811223344', 'CONTACTED', 'WEBSITE', 'Interested in server-side time tracking compliance features.', 6),
(3, 'Karthik', 'Raman', 'Zeta Cloud Systems', 'karthik@zetacloud.io', '+91 9988776655', 'NEW', 'OUTREACH', 'Sent initial pitch deck for TeamCRM enterprise tier.', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, company_name, industry, website, primary_contact_name, primary_contact_email, primary_contact_phone, address, account_manager_id) VALUES
(1, 'Apex Logistics Ltd', 'Logistics & Supply Chain', 'https://apexlogistics.in', 'Rohan Mehta', 'rohan@apexlogistics.in', '+91 9123456789', 'BKC, Mumbai, Maharashtra', 6),
(2, 'Starlight Retailers Pvt Ltd', 'E-Commerce', 'https://starlightretail.com', 'Divya Rao', 'divya@starlightretail.com', '+91 9765432190', 'Indiranagar, Bengaluru, Karnataka', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO deals (id, title, customer_id, stage, deal_value, currency, expected_close_date, assigned_to, notes) VALUES
(1, 'Enterprise 50-Seat Subscription', 1, 'NEGOTIATION', 36000.00, 'USD', '2026-11-30', 6, 'Negotiating 15% annual commitment discount.'),
(2, 'Custom API Integration & SLA', 2, 'PROPOSAL', 14500.00, 'USD', '2026-12-15', 6, 'Sent proposal for custom webhook sync with SAP.')
ON CONFLICT (id) DO NOTHING;

-- 8. TASKS (Kanban)
INSERT INTO tasks (id, project_id, task_code, title, description, type, priority, status, assignee_id, reporter_id, due_date, estimated_hours, labels, linked_lead_id) VALUES
(1, 1, 'CRM-101', 'Implement Server-Side Time Tracking Session Logic', 'Build REST endpoints for start, pause, resume, and calculate cycle time securely on Spring Boot.', 'FEATURE', 'URGENT', 'IN_PROGRESS', 4, 2, '2026-10-25', 16.00, 'backend,timetrack,core', 1),
(2, 1, 'CRM-102', 'Build Topbar Live Running Timer Chip with Ticks', 'Create React header widget calculating 00:42:15 from server start_time with pause/stop dropdown.', 'FEATURE', 'HIGH', 'IN_PROGRESS', 3, 2, '2026-10-26', 12.00, 'frontend,ui,timer', 1),
(3, 1, 'CRM-103', 'API Handoff Module: Contract viewer & Status Flow', 'Design UI for draft -> ready -> integrating lifecycle with JSON request/response preview.', 'FEATURE', 'MEDIUM', 'TODO', 3, 2, '2026-10-28', 14.00, 'frontend,api-handoff', NULL),
(4, 1, 'CRM-104', 'Automated Daily Inactivity Timer Auto-Stop Job', 'Spring @Scheduled job to pause sessions exceeding 10 hours and notify managers.', 'FEATURE', 'MEDIUM', 'REVIEW', 4, 2, '2026-10-24', 8.00, 'backend,scheduler', NULL),
(5, 1, 'CRM-105', 'Regression Test for Concurrent WebSocket Mentions', 'Run load tests on STOMP broker when 100 users are simultaneously mentioned.', 'BUG', 'HIGH', 'DONE', 5, 2, '2026-10-20', 10.00, 'qa,testing,websocket', NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. CHECKLIST ITEMS
INSERT INTO task_checklist_items (id, task_id, text, is_done, position, done_by) VALUES
(1, 1, 'Design task_time_logs table with start_time & end_time', TRUE, 1, 4),
(2, 1, 'Enforce rule: user can have only one active running timer', TRUE, 2, 4),
(3, 1, 'Implement manual adjustment with audit logging', FALSE, 3, NULL),
(4, 1, 'Unit test duration calculation and idle gap logic', FALSE, 4, NULL),
(5, 2, 'Create topbar sticky chip with soft purple pulse', TRUE, 1, 3),
(6, 2, 'Handle browser reload time continuity using server start_time', TRUE, 2, 3),
(7, 2, 'Integrate quick pause/resume action without opening task drawer', FALSE, 3, NULL)
ON CONFLICT (id) DO NOTHING;

-- 10. TIME LOGS
INSERT INTO task_time_logs (id, task_id, user_id, start_time, end_time, duration_seconds, note, source) VALUES
(1, 1, 4, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', 7200, 'Database entity setup & repository query drafting', 'TIMER'),
(2, 1, 4, CURRENT_TIMESTAMP - INTERVAL '1 hour', NULL, 3600, 'Live active timer session for endpoint logic', 'TIMER'),
(3, 2, 3, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 7200, 'Topbar layout and Tailwind theme tokens setup', 'TIMER')
ON CONFLICT (id) DO NOTHING;

-- 11. API HANDOFF CONTRACTS
INSERT INTO api_docs (id, task_id, title, http_method, endpoint, status, version, environment, auth_required, request_body_json, response_body_json, created_by) VALUES
(1, 1, 'Start Task Timer Session', 'POST', '/api/v1/tasks/{taskId}/time/start', 'READY_FOR_INTEGRATION', 'v1.1.0', 'DEV', 'Bearer JWT (TIME_TRACK)', 
'{\n  "note": "Working on frontend component"\n}',
'{\n  "logId": 102,\n  "taskId": 1,\n  "startTime": "2026-10-15T10:00:00Z",\n  "status": "RUNNING"\n}', 4)
ON CONFLICT (id) DO NOTHING;

-- 12. TASK DISCUSSIONS
INSERT INTO task_comments (id, task_id, author_id, type, body, status) VALUES
(1, 1, 3, 'QUERY', 'Hey @priya.backend, what HTTP status code does the timer endpoint return if another task timer is already active?', 'ANSWERED'),
(2, 1, 4, 'GENERAL', '@rahul.frontend It automatically pauses the previous active session and returns 200 OK with the new active session ID and a warning banner in response.', 'RESOLVED')
ON CONFLICT (id) DO NOTHING;

-- 13. MEETINGS
INSERT INTO meetings (id, title, agenda, start_time, end_time, duration_minutes, meeting_link, status, linked_task_id, organizer_id) VALUES
(1, 'Sprint 42 API Handoff & Architecture Sync', 'Review Time Tracking payload specs and Kanban drag-and-drop state reconciliation.', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 30 minutes', 30, 'https://meet.google.com/crm-sync-dev', 'SCHEDULED', 1, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO meeting_attendees (meeting_id, user_id, response_status) VALUES
(1, 2, 'ACCEPTED'),
(1, 3, 'ACCEPTED'),
(1, 4, 'ACCEPTED'),
(1, 5, 'MAYBE')
ON CONFLICT DO NOTHING;

-- 14. NOTIFICATIONS
INSERT INTO notifications (id, recipient_id, sender_id, title, message, type, reference_type, reference_id, is_read) VALUES
(1, 3, 4, 'API Ready for Integration', 'Priya marked "Start Task Timer Session" ready for frontend integration on CRM-101.', 'API_READY', 'TASK', 1, FALSE),
(2, 3, 2, 'New Meeting Invite', 'Neha invited you to "Sprint 42 API Handoff & Architecture Sync".', 'MEETING_INVITE', 'MEETING', 1, FALSE),
(3, 4, 3, 'New Discussion Query', 'Rahul asked a question on CRM-101: "HTTP status code on active timer"', 'QUERY_REPLY', 'TASK', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 15. AUDIT LOGS
INSERT INTO audit_logs (actor_id, actor_email, action, entity_name, entity_id, old_value, new_value) VALUES
(2, 'manager@teamcrm.com', 'TASK_STATUS_CHANGE', 'TASK', '1', 'TODO', 'IN_PROGRESS'),
(4, 'priya.backend@teamcrm.com', 'API_DOC_PUBLISH', 'API_DOC', '1', 'DRAFT', 'READY_FOR_INTEGRATION'),
(2, 'manager@teamcrm.com', 'MEETING_SCHEDULE', 'MEETING', '1', NULL, 'Sprint 42 API Handoff & Architecture Sync')
ON CONFLICT DO NOTHING;
