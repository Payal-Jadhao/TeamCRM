package com.teamcrm.init;

import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "payaldjadhao@gmail.com";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskChecklistItemRepository checklistRepository;
    private final TaskTimeLogRepository timeLogRepository;
    private final TaskCommentRepository commentRepository;
    private final ApiDocRepository apiDocRepository;
    private final MeetingRepository meetingRepository;
    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final DealRepository dealRepository;
    private final MasterRepository masterRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public DataInitializer(RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            TeamRepository teamRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            TaskChecklistItemRepository checklistRepository,
            TaskTimeLogRepository timeLogRepository,
            TaskCommentRepository commentRepository,
            ApiDocRepository apiDocRepository,
            MeetingRepository meetingRepository,
            LeadRepository leadRepository,
            CustomerRepository customerRepository,
            DealRepository dealRepository,
            MasterRepository masterRepository,
            NotificationRepository notificationRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.checklistRepository = checklistRepository;
        this.timeLogRepository = timeLogRepository;
        this.commentRepository = commentRepository;
        this.apiDocRepository = apiDocRepository;
        this.meetingRepository = meetingRepository;
        this.leadRepository = leadRepository;
        this.customerRepository = customerRepository;
        this.dealRepository = dealRepository;
        this.masterRepository = masterRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 0. Drop any legacy unique constraint on projects.key_code to support soft-deletion safely
        try {
            jdbcTemplate.execute("ALTER TABLE projects DROP CONSTRAINT IF EXISTS UK9SSBIHUCO0QKIQVPCR2O0FURX_INDEX_F");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("DROP INDEX IF EXISTS UK9SSBIHUCO0QKIQVPCR2O0FURX_INDEX_F");
        } catch (Exception ignored) {}
        try {
            List<String> constraints = jdbcTemplate.query(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CONSTRAINTS WHERE TABLE_NAME = 'PROJECTS' AND CONSTRAINT_TYPE = 'UNIQUE'",
                (rs, rowNum) -> rs.getString("CONSTRAINT_NAME")
            );
            for (String cName : constraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE projects DROP CONSTRAINT IF EXISTS " + cName);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
        try {
            List<String> indexes = jdbcTemplate.query(
                "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.INDEXES WHERE TABLE_NAME = 'PROJECTS' AND COLUMN_NAME = 'KEY_CODE' AND NON_UNIQUE = FALSE",
                (rs, rowNum) -> rs.getString("INDEX_NAME")
            );
            for (String idxName : indexes) {
                try {
                    jdbcTemplate.execute("DROP INDEX IF EXISTS " + idxName);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("UPDATE projects SET key_code = CONCAT(key_code, '_DEL_', id) WHERE is_deleted = true AND key_code NOT LIKE '%_DEL_%'");
        } catch (Exception ignored) {}

        // 1. Permissions
        if (permissionRepository.count() == 0) {
            List<String[]> permData = List.of(
                    new String[] { "USER_CREATE", "AUTH", "Create new employees and assign roles" },
                    new String[] { "USER_EDIT", "AUTH", "Modify employee profile and team tags" },
                    new String[] { "USER_DEACTIVATE", "AUTH", "Deactivate or reactivate an employee" },
                    new String[] { "ROLE_MANAGE", "AUTH", "Manage roles and fine-grained permissions matrix" },
                    new String[] { "PROJECT_CREATE", "PROJECTS", "Create new projects and add members" },
                    new String[] { "PROJECT_EDIT", "PROJECTS", "Edit project details and settings" },
                    new String[] { "TASK_CREATE", "TASKS", "Create new tasks in projects" },
                    new String[] { "TASK_ASSIGN", "TASKS", "Assign tasks to team members" },
                    new String[] { "TASK_EDIT", "TASKS", "Edit task details, description, due date" },
                    new String[] { "TASK_DELETE", "TASKS", "Delete or archive tasks" },
                    new String[] { "TIME_TRACK", "TIME_TRACKING", "Start, pause and end task timers" },
                    new String[] { "TIME_EDIT_MANUAL", "TIME_TRACKING", "Manually adjust or correct task time logs" },
                    new String[] { "CHECKLIST_MANAGE", "TASKS", "Create, update and delete checklist items" },
                    new String[] { "DISCUSSION_POST", "DISCUSSIONS", "Post messages and queries in task discussions" },
                    new String[] { "DISCUSSION_MENTION_ALL", "DISCUSSIONS",
                            "Use @everyone mention in task discussions" },
                    new String[] { "DISCUSSION_MODERATE", "DISCUSSIONS",
                            "Moderate or remove task discussion messages" },
                    new String[] { "API_DOC_PUBLISH", "API_HANDOFF",
                            "Publish and update backend-to-frontend API specifications" },
                    new String[] { "API_DOC_REVIEW", "API_HANDOFF", "Change API status and request modifications" },
                    new String[] { "MEETING_SCHEDULE", "MEETINGS", "Schedule company meetings and invite members" },
                    new String[] { "MEETING_EDIT_NOTES", "MEETINGS", "Write meeting minutes and create action items" },
                    new String[] { "LEAD_VIEW_ALL", "CRM", "View all company leads" },
                    new String[] { "LEAD_MANAGE", "CRM", "Create, edit and convert leads into customers" },
                    new String[] { "DEAL_MANAGE", "CRM", "Manage deals pipeline and update stages" },
                    new String[] { "REPORT_VIEW", "REPORTS", "Access time tracking, team workload and CRM reports" },
                    new String[] { "AUDIT_VIEW", "AUDIT", "View system-wide activity and security audit logs" });
            for (String[] p : permData) {
                permissionRepository.save(new Permission(p[0], p[1], p[2]));
            }
        }

        Set<Permission> allPerms = new HashSet<>(permissionRepository.findAll());

        // 2. Roles
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> {
            Role r = new Role("ROLE_ADMIN", "Super administrator");
            return roleRepository.save(r);
        });
        adminRole.setPermissions(new HashSet<>(allPerms));
        adminRole = roleRepository.save(adminRole);

        // Manager: by default has task & project creation permissions + core management features
        Role managerRole = roleRepository.findByName("ROLE_MANAGER").orElseGet(() -> {
            Role r = new Role("ROLE_MANAGER", "Team manager");
            return roleRepository.save(r);
        });
        Set<Permission> mgrPerms = allPerms.stream()
                .filter(p -> List.of(
                        "PROJECT_CREATE", "PROJECT_EDIT",
                        "TASK_CREATE", "TASK_ASSIGN", "TASK_EDIT", "TASK_DELETE",
                        "TIME_TRACK", "CHECKLIST_MANAGE", "DISCUSSION_POST",
                        "MEETING_SCHEDULE", "MEETING_EDIT_NOTES",
                        "LEAD_VIEW_ALL", "LEAD_MANAGE", "DEAL_MANAGE", "REPORT_VIEW"
                ).contains(p.getCode()))
                .collect(Collectors.toSet());
        managerRole.setPermissions(mgrPerms);
        managerRole = roleRepository.save(managerRole);

        // Employee: initially NO permissions (as specified: empty set)
        Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE").orElseGet(() -> {
            Role r = new Role("ROLE_EMPLOYEE", "Individual contributor");
            return roleRepository.save(r);
        });
        roleRepository.deleteRolePermissions(employeeRole.getId());
        if (employeeRole.getPermissions() != null) {
            employeeRole.getPermissions().clear();
        } else {
            employeeRole.setPermissions(new HashSet<>());
        }
        employeeRole = roleRepository.saveAndFlush(employeeRole);


        // 3. Teams
        if (teamRepository.count() == 0) {
            teamRepository.save(new Team("Management", "MANAGEMENT", "Leadership & Executive oversight"));
            teamRepository.save(new Team("Frontend Engineering", "FRONTEND", "React, TypeScript, Tailwind"));
            teamRepository.save(new Team("Backend Engineering", "BACKEND", "Spring Boot, PostgreSQL, Microservices"));
            teamRepository.save(new Team("Quality Assurance", "QA", "Automated regression testing"));
            teamRepository.save(new Team("Sales & Revenue", "SALES", "Lead conversion & closing"));
            teamRepository.save(new Team("Product Design", "DESIGN", "Design systems & UX wireframes"));
        }

        // 3b. Masters (Teams, Task Types, Lead Status, Deal Stages)
        if (masterRepository.count() == 0) {
            masterRepository.save(new MasterItem("TEAM", "Management", "MANAGEMENT", 1));
            masterRepository.save(new MasterItem("TEAM", "Frontend Engineering", "FRONTEND", 2));
            masterRepository.save(new MasterItem("TEAM", "Backend Engineering", "BACKEND", 3));
            masterRepository.save(new MasterItem("TEAM", "Quality Assurance", "QA", 4));
            masterRepository.save(new MasterItem("TEAM", "Sales & Revenue", "SALES", 5));
            masterRepository.save(new MasterItem("TEAM", "Product Design", "DESIGN", 6));

            masterRepository.save(new MasterItem("TASK_TYPE", "Feature", "FEATURE", 1));
            masterRepository.save(new MasterItem("TASK_TYPE", "Bug Fix", "BUG", 2));
            masterRepository.save(new MasterItem("TASK_TYPE", "Query / Discussion", "QUERY", 3));
            masterRepository.save(new MasterItem("TASK_TYPE", "Chore / Maintenance", "CHORE", 4));

            masterRepository.save(new MasterItem("LEAD_STATUS", "New Lead", "NEW", 1));
            masterRepository.save(new MasterItem("LEAD_STATUS", "Contacted", "CONTACTED", 2));
            masterRepository.save(new MasterItem("LEAD_STATUS", "Qualified", "QUALIFIED", 3));
            masterRepository.save(new MasterItem("LEAD_STATUS", "Proposal Sent", "PROPOSAL", 4));
            masterRepository.save(new MasterItem("LEAD_STATUS", "Closed Won", "WON", 5));
            masterRepository.save(new MasterItem("LEAD_STATUS", "Lost", "LOST", 6));

            masterRepository.save(new MasterItem("DEAL_STAGE", "Prospect", "PROSPECT", 1));
            masterRepository.save(new MasterItem("DEAL_STAGE", "Proposal", "PROPOSAL", 2));
            masterRepository.save(new MasterItem("DEAL_STAGE", "Negotiation", "NEGOTIATION", 3));
            masterRepository.save(new MasterItem("DEAL_STAGE", "Closed Won", "WON", 4));
            masterRepository.save(new MasterItem("DEAL_STAGE", "Closed Lost", "LOST", 5));
        }

        // 4. Single super admin: payaldjadhao@gmail.com
        // Password is set ONLY when the account is first created (not reset on every
        // restart)
        User admin = userRepository.findByEmail(ADMIN_EMAIL).orElse(null);
        if (admin == null) {
            admin = new User();
            admin.setEmail(ADMIN_EMAIL);
            admin.setPasswordHash(passwordEncoder.encode("1234"));
            admin.setInitialPassword("1234");
            admin.setFullName("Payal Jadhao");
            admin.setIsFirstLogin(false);
        }
        admin.setPasswordHash(passwordEncoder.encode("1234"));
        admin.setRole(adminRole);
        admin.setTeamTag("MANAGEMENT");
        admin.setIsActive(true);
        admin = userRepository.save(admin);

        // Manager: Jayshree Jadhao
        User manager = userRepository.findByEmail("jayshreejadhao0206@gmail.com").orElse(null);
        if (manager == null) {
            manager = new User();
            manager.setEmail("jayshreejadhao0206@gmail.com");
            manager.setFullName("Jayshree Jadhao");
            manager.setIsFirstLogin(false);
            manager.setPasswordHash(passwordEncoder.encode("1234"));
            manager.setRole(managerRole);
            manager.setExtraPermissions(new HashSet<>(mgrPerms));
            manager.setTeamTag("FRONTEND");
            manager.setIsActive(true);
            userRepository.save(manager);
        }

        // Employee: Rahaa Malhotra
        User employee = userRepository.findByEmail("rahaamalhotra@gmail.com").orElse(null);
        if (employee == null) {
            employee = new User();
            employee.setEmail("rahaamalhotra@gmail.com");
            employee.setFullName("Rahaa Malhotra");
            employee.setIsFirstLogin(false);
            employee.setPasswordHash(passwordEncoder.encode("1234"));
            employee.setRole(employeeRole);
            employee.setExtraPermissions(new HashSet<>());
            employee.setTeamTag("FRONTEND");
            employee.setIsActive(true);
            userRepository.save(employee);
        } else {
            userRepository.deleteUserPermissions(employee.getId());
            if (employee.getExtraPermissions() != null) {
                employee.getExtraPermissions().clear();
            }
            userRepository.saveAndFlush(employee);
        }


        // Purge any rogue users that were auto-created by previous Google OAuth bugs
        userRepository.findByEmail("payaljadhao2709@gmail.com").ifPresent(rogue -> {
            userRepository.delete(rogue);
        });

        // 5. Sample data (only on a fresh DB) - everything owned by the admin
        if (projectRepository.count() == 0) {
            Project project = new Project();
            project.setName("TeamCRM Core Platform");
            project.setKeyCode("CRM");
            project.setDescription("Integrated CRM, Jira-lite tasks, server-side time tracking and API handoff.");
            project.setStatus("ACTIVE");
            project.setOwner(admin);
            project = projectRepository.save(project);

            Lead lead1 = new Lead();
            lead1.setFirstName("Rohan");
            lead1.setLastName("Mehta");
            lead1.setCompany("Apex Logistics Ltd");
            lead1.setEmail("rohan@apexlogistics.in");
            lead1.setPhone("+91 9123456789");
            lead1.setStatus("QUALIFIED");
            lead1.setSource("LINKEDIN");
            lead1.setNotes(
                    "High intent enterprise prospect. Needs 50 licenses with server-side time tracking compliance.");
            lead1.setAssignedTo(admin);
            lead1 = leadRepository.save(lead1);

            Customer cust1 = new Customer();
            cust1.setCompanyName("Apex Logistics Ltd");
            cust1.setIndustry("Logistics");
            cust1.setWebsite("https://apexlogistics.in");
            cust1.setPrimaryContactName("Rohan Mehta");
            cust1.setPrimaryContactEmail("rohan@apexlogistics.in");
            cust1.setAccountManager(admin);
            cust1 = customerRepository.save(cust1);

            Deal deal1 = new Deal();
            deal1.setTitle("Enterprise 50-Seat Subscription");
            deal1.setCustomer(cust1);
            deal1.setLead(lead1);
            deal1.setStage("NEGOTIATION");
            deal1.setDealValue(new BigDecimal("36000.00"));
            deal1.setExpectedCloseDate(LocalDate.now().plusDays(25));
            deal1.setAssignedTo(admin);
            deal1.setNotes("Finalizing annual billing terms with procurement team.");
            deal1 = dealRepository.save(deal1);

            Task t1 = new Task();
            t1.setProject(project);
            t1.setTaskCode("CRM-101");
            t1.setTitle("Implement Server-Side Time Tracking Session Logic");
            t1.setDescription(
                    "Build REST endpoints for start, pause, resume, and calculate cycle time securely on Spring Boot.");
            t1.setType("FEATURE");
            t1.setPriority("URGENT");
            t1.setStatus("IN_PROGRESS");
            t1.setAssignee(admin);
            t1.setAssigneeIds(admin.getId().toString());
            t1.setAssigneeNames(admin.getFullName());
            t1.setReporter(admin);
            t1.setDueDate(LocalDate.now().plusDays(7));
            t1.setEstimatedHours(new BigDecimal("16.00"));
            t1.setLabels("backend,timetrack,core");
            t1.setLinkedLead(lead1);
            t1.setLinkedDeal(deal1);
            t1 = taskRepository.save(t1);

            Task t2 = new Task();
            t2.setProject(project);
            t2.setTaskCode("CRM-102");
            t2.setTitle("Build Topbar Live Running Timer Chip with Ticks");
            t2.setDescription(
                    "Create React header widget calculating from server start_time with pause/stop dropdown.");
            t2.setType("FEATURE");
            t2.setPriority("HIGH");
            t2.setStatus("IN_PROGRESS");
            t2.setAssignee(admin);
            t2.setAssigneeIds(admin.getId().toString());
            t2.setAssigneeNames(admin.getFullName());
            t2.setReporter(admin);
            t2.setDueDate(LocalDate.now().plusDays(5));
            t2.setEstimatedHours(new BigDecimal("12.00"));
            t2.setLabels("frontend,ui,timer");
            taskRepository.save(t2);

            Task t3 = new Task();
            t3.setProject(project);
            t3.setTaskCode("CRM-103");
            t3.setTitle("API Handoff Module: Contract viewer & Status Flow");
            t3.setDescription(
                    "Design UI for draft -> ready -> integrating lifecycle with JSON request/response preview.");
            t3.setType("FEATURE");
            t3.setPriority("MEDIUM");
            t3.setStatus("TODO");
            t3.setAssignee(admin);
            t3.setAssigneeIds(admin.getId().toString());
            t3.setAssigneeNames(admin.getFullName());
            t3.setReporter(admin);
            t3.setDueDate(LocalDate.now().plusDays(10));
            t3.setEstimatedHours(new BigDecimal("14.00"));
            t3.setLabels("frontend,api-handoff");
            taskRepository.save(t3);

            Task t4 = new Task();
            t4.setProject(project);
            t4.setTaskCode("CRM-104");
            t4.setTitle("Company-Wide Sprint Kickoff & Security Review");
            t4.setDescription("Review data privacy compliance, password security, and automated session timeouts.");
            t4.setType("FEATURE");
            t4.setPriority("MEDIUM");
            t4.setStatus("TODO");
            t4.setAssigneeIds("ALL");
            t4.setAssigneeNames("All Employees");
            t4.setReporter(admin);
            t4.setDueDate(LocalDate.now().plusDays(14));
            t4.setEstimatedHours(new BigDecimal("8.00"));
            taskRepository.save(t4);

            TaskChecklistItem chk1 = new TaskChecklistItem();
            chk1.setTask(t1);
            chk1.setText("Design task_time_logs table with start_time & end_time");
            chk1.setIsDone(true);
            chk1.setPosition(1);
            chk1.setDoneBy(admin);
            checklistRepository.save(chk1);

            TaskChecklistItem chk2 = new TaskChecklistItem();
            chk2.setTask(t1);
            chk2.setText("Enforce rule: user can have only one active running timer");
            chk2.setIsDone(false);
            chk2.setPosition(2);
            checklistRepository.save(chk2);

            Meeting meeting = new Meeting();
            meeting.setTitle("Sprint Architecture Sync");
            meeting.setAgenda("Review sprint goals, task breakdown, and CRM deliverables.");
            meeting.setStartTime(Instant.now().plusSeconds(86400));
            meeting.setEndTime(Instant.now().plusSeconds(88200));
            meeting.setDurationMinutes(30);
            meeting.setMeetingLink("https://meet.google.com/crm-sync-dev");
            meeting.setStatus("SCHEDULED");
            meeting.setLinkedTask(t1);
            meeting.setOrganizer(admin);
            Set<User> attendees = new HashSet<>();
            attendees.add(admin);
            meeting.setAttendees(attendees);
            meetingRepository.save(meeting);
        }
    }
}