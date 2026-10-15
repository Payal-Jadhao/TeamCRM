-- ====================================================================
-- TeamCRM Database Schema (PostgreSQL)
-- Modules: Auth, RBAC, Teams, CRM, Projects, Tasks, Time Tracking,
--          Checklist, Discussions, API Handoff, Meetings, Notifications, Audit
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. RBAC & USERS
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE, -- e.g. 'TASK_CREATE', 'TIME_EDIT_MANUAL'
    module VARCHAR(50) NOT NULL,       -- 'TASKS', 'TIME_TRACKING', 'CRM', 'MEETINGS', etc.
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    team_tag VARCHAR(50), -- 'FRONTEND', 'BACKEND', 'SALES', 'QA', 'DESIGN'
    phone VARCHAR(30),
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_first_login BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL DEFAULT TRUE, -- Can be used to explicitly grant or revoke
    PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    tag VARCHAR(30) NOT NULL UNIQUE, -- 'FRONTEND', 'BACKEND', etc.
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- 3. CRM MODULE
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80),
    company VARCHAR(120),
    email VARCHAR(150),
    phone VARCHAR(40),
    status VARCHAR(40) NOT NULL DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'QUALIFIED', 'LOST'
    source VARCHAR(80),                         -- 'WEBSITE', 'LINKEDIN', 'REFERRAL', 'OUTREACH'
    notes TEXT,
    assigned_to BIGINT REFERENCES users(id),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    industry VARCHAR(80),
    website VARCHAR(200),
    lead_id BIGINT REFERENCES leads(id),
    primary_contact_name VARCHAR(120),
    primary_contact_email VARCHAR(150),
    primary_contact_phone VARCHAR(40),
    address TEXT,
    account_manager_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(40),
    job_title VARCHAR(80),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deals (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    customer_id BIGINT REFERENCES customers(id),
    lead_id BIGINT REFERENCES leads(id),
    stage VARCHAR(50) NOT NULL DEFAULT 'PROSPECT', -- 'PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'
    deal_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    expected_close_date DATE,
    assigned_to BIGINT REFERENCES users(id),
    notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT REFERENCES leads(id),
    customer_id BIGINT REFERENCES customers(id),
    deal_id BIGINT REFERENCES deals(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(40) NOT NULL, -- 'CALL', 'MEETING', 'NOTE', 'EMAIL'
    summary VARCHAR(255) NOT NULL,
    details TEXT,
    activity_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PROJECTS & TASKS (Jira-Lite)
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    key_code VARCHAR(20) NOT NULL UNIQUE, -- e.g. 'PRJ', 'CRM'
    description TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE',  -- 'ACTIVE', 'ARCHIVED'
    owner_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER',
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_code VARCHAR(30) NOT NULL UNIQUE, -- e.g. 'CRM-101'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL DEFAULT 'FEATURE', -- 'FEATURE', 'BUG', 'QUERY', 'CHORE'
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    status VARCHAR(30) NOT NULL DEFAULT 'TODO', -- 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'
    assignee_id BIGINT REFERENCES users(id),
    reporter_id BIGINT REFERENCES users(id),
    due_date DATE,
    estimated_hours NUMERIC(6, 2) DEFAULT 0.00,
    labels VARCHAR(255), -- comma-separated or json
    linked_lead_id BIGINT REFERENCES leads(id),
    linked_customer_id BIGINT REFERENCES customers(id),
    linked_deal_id BIGINT REFERENCES deals(id),
    checklist_must_be_completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_labels (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color_hex VARCHAR(20) DEFAULT '#6D4FC9'
);

CREATE TABLE IF NOT EXISTS task_links (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    linked_task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    link_type VARCHAR(40) NOT NULL -- 'BLOCKS', 'BLOCKED_BY', 'RELATES_TO'
);

-- 5. TIME TRACKING
CREATE TABLE IF NOT EXISTS task_time_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds BIGINT DEFAULT 0,
    note VARCHAR(255),
    source VARCHAR(40) NOT NULL DEFAULT 'TIMER', -- 'TIMER', 'MANUAL', 'AUTO_STOPPED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TASK CHECKLIST
CREATE TABLE IF NOT EXISTS task_checklist_items (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 0,
    done_by BIGINT REFERENCES users(id),
    done_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. DISCUSSIONS & COLLABORATION
CREATE TABLE IF NOT EXISTS task_comments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(30) NOT NULL DEFAULT 'GENERAL', -- 'QUERY', 'BLOCKER', 'UPDATE', 'GENERAL'
    body TEXT NOT NULL,
    parent_id BIGINT REFERENCES task_comments(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'OPEN', -- for queries: 'OPEN', 'ANSWERED', 'RESOLVED'
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comment_mentions (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
    mentioned_user_id BIGINT REFERENCES users(id),
    mentioned_team VARCHAR(50), -- e.g. 'FRONTEND', 'BACKEND', 'QA'
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS attachments (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
    comment_id BIGINT REFERENCES task_comments(id) ON DELETE CASCADE,
    uploaded_by BIGINT REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. BACKEND TO FRONTEND API HANDOFF
CREATE TABLE IF NOT EXISTS api_docs (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    http_method VARCHAR(10) NOT NULL, -- 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
    endpoint VARCHAR(255) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'READY_FOR_INTEGRATION', 'INTEGRATING', 'INTEGRATED', 'CHANGE_REQUESTED'
    version VARCHAR(30) NOT NULL DEFAULT 'v1.0.0',
    environment VARCHAR(30) DEFAULT 'DEV', -- 'DEV', 'STAGING', 'PROD'
    auth_required VARCHAR(100),
    error_codes TEXT,
    swagger_url VARCHAR(300),
    postman_url VARCHAR(300),
    request_headers TEXT,
    request_body_json TEXT,
    response_body_json TEXT,
    change_notes TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS api_doc_versions (
    id BIGSERIAL PRIMARY KEY,
    api_doc_id BIGINT NOT NULL REFERENCES api_docs(id) ON DELETE CASCADE,
    version VARCHAR(30) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_body_json TEXT,
    response_body_json TEXT,
    change_summary TEXT,
    changed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_doc_assignees (
    api_doc_id BIGINT NOT NULL REFERENCES api_docs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (api_doc_id, user_id)
);

-- 9. MEETINGS
CREATE TABLE IF NOT EXISTS meetings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    agenda TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    meeting_link VARCHAR(300),
    location VARCHAR(150),
    status VARCHAR(30) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    linked_task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
    linked_comment_id BIGINT REFERENCES task_comments(id) ON DELETE SET NULL,
    organizer_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE'
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS meeting_notes (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    notes_markdown TEXT,
    action_items_json TEXT, -- array of { id, text, assigneeId, convertedToTaskId }
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'TASK_ASSIGNED', 'MENTION', 'API_READY', 'MEETING_INVITE', 'QUERY_REPLY'
    reference_type VARCHAR(50), -- 'TASK', 'COMMENT', 'API_DOC', 'MEETING'
    reference_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_mentions BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_task_assign BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_api_ready BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_meeting BOOLEAN NOT NULL DEFAULT TRUE
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id),
    actor_email VARCHAR(150),
    action VARCHAR(80) NOT NULL, -- 'USER_CREATE', 'TASK_STATUS_CHANGE', 'TIME_EDIT_MANUAL', 'API_PUBLISH', etc.
    entity_name VARCHAR(60) NOT NULL, -- 'TASK', 'USER', 'TIME_LOG', 'PERMISSION', 'MEETING'
    entity_id VARCHAR(60),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
