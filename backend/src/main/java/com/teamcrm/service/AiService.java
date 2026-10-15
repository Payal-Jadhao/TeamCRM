package com.teamcrm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamcrm.dto.OtherDtos.AiPromptRequest;
import com.teamcrm.dto.OtherDtos.AiResponseDto;
import com.teamcrm.entity.Deal;
import com.teamcrm.entity.Meeting;
import com.teamcrm.entity.Task;
import com.teamcrm.entity.User;
import com.teamcrm.repository.DealRepository;
import com.teamcrm.repository.MeetingRepository;
import com.teamcrm.repository.TaskRepository;
import com.teamcrm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiService {

    @Value("${app.gemini.api-key:}")
    private String configuredGeminiApiKey;

    private final TaskRepository taskRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;
    private final ObjectMapper objectMapper;

    public AiService(TaskRepository taskRepository,
                     DealRepository dealRepository,
                     UserRepository userRepository,
                     MeetingRepository meetingRepository,
                     ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
        this.meetingRepository = meetingRepository;
        this.objectMapper = objectMapper;
    }

    public AiResponseDto generateAiAssistance(AiPromptRequest req) {
        String type = req.contextType() != null ? req.contextType().toUpperCase() : "COPILOT_CHAT";
        String content = req.content() != null ? req.content().trim() : "";
        String prompt = req.prompt() != null ? req.prompt().trim() : "";
        String effectiveApiKey = (req.apiKey() != null && !req.apiKey().isBlank()) ? req.apiKey().trim() : configuredGeminiApiKey;

        String rawQuery = content.isEmpty() ? prompt : content;
        String normalizedQuery = rawQuery.toLowerCase().trim();
        List<String> items = new ArrayList<>();

        // 1. If Gemini API key is provided, attempt live Google Generative Language call with full RAG context
        if (effectiveApiKey != null && !effectiveApiKey.isBlank()) {
            String geminiAnswer = callGeminiWithFullContext(rawQuery, effectiveApiKey);
            if (geminiAnswer != null && !geminiAnswer.isBlank()) {
                items.addAll(extractOrGenerateItems(rawQuery, geminiAnswer));
                return new AiResponseDto(geminiAnswer, items);
            }
        }

        // 2. Comprehensive Agentic RAG Knowledge Engine (Runs when no API key is provided or offline)
        return generateAgenticResponse(rawQuery, normalizedQuery, type);
    }

    /**
     * Agentic RAG Knowledge Engine: Synthesizes live database facts, system architecture,
     * security protocols, and domain models to answer ANY question about TeamCRM intelligently.
     */
    private AiResponseDto generateAgenticResponse(String rawQuery, String q, String type) {
        List<String> items = new ArrayList<>();
        StringBuilder sb = new StringBuilder();

        // Topic 1: Tasks / Specific Task Queries (e.g. "task 1", "CRM-101", "task confusion", "explain task")
        Optional<Task> matchedTask = findReferencedTask(q);
        if (matchedTask.isPresent() && (q.contains("task") || q.contains("explain") || q.contains("elaborate") || q.contains("confusion") || q.contains("samjhao") || q.contains("crm-") || q.contains("code"))) {
            Task t = matchedTask.get();
            sb.append("📋 **AI Deep-Dive & Execution Plan for [").append(t.getTaskCode()).append("]: ").append(t.getTitle()).append("**\n\n");
            sb.append("• **Priority & Type:** `").append(t.getPriority()).append("` | `").append(t.getType()).append("`\n");
            sb.append("• **Current Status:** `").append(t.getStatus()).append("`\n");
            sb.append("• **Assignee(s):** ").append(t.getAssigneeNames() != null ? t.getAssigneeNames() : "Unassigned").append("\n");
            sb.append("• **Estimated Effort:** ").append(t.getEstimatedHours() != null ? t.getEstimatedHours() + " hrs" : "Not specified").append("\n\n");
            
            sb.append("🎯 **Objective & Business Scope:**\n");
            sb.append(t.getDescription() != null && !t.getDescription().isBlank() ? t.getDescription() : "Core deliverable in current sprint iteration.").append("\n\n");

            sb.append("🛠️ **Step-by-Step Technical Blueprint:**\n");
            sb.append("1. **Data Model & Schema:** Validate entity annotations, database migrations, and foreign key relations.\n");
            sb.append("2. **Service Layer & Business Rules:** Encapsulate operations inside `@Transactional` service methods to guarantee ACID compliance.\n");
            sb.append("3. **Security & Role Scoping:** Enforce role validations (Admin, Manager, Employee) at both endpoint and data filtering levels.\n");
            sb.append("4. **Frontend Integration:** Wire dynamic React state hooks, optimistic UI feedback, and error boundaries.\n\n");

            sb.append("💡 **Key Gotchas & Edge Cases:**\n");
            sb.append("- Ensure idempotent state transitions to avoid race conditions during concurrent user operations.\n");
            sb.append("- Verify server-side timer session closes before marking task as `DONE`.\n");
            sb.append("- Audit log entries are automatically created for state modifications.\n\n");
            sb.append("🚀 **Recommended Action:** Click 'Create Sprint Task' or start the server timer to log active billable development hours.");

            items.addAll(generateTailoredChecklist(t.getTitle(), t.getDescription()));
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 2: Why TeamCRM is Better / Competitive Advantage / Interview Prep (Check first for 'why/better/pitch')
        if (q.contains("why") || q.contains("better") || q.contains("interview") || q.contains("prep") || q.contains("compare") || q.contains("salesforce") || q.contains("jira") || q.contains("pitch")) {
            sb.append("⭐ **Why TeamCRM is Superior: Key Competitive Advantages & Interview Pitch**\n\n");
            sb.append("When explaining TeamCRM in an interview or executive pitch, highlight these core differentiators:\n\n");
            sb.append("1. **Unified Enterprise Workflow:** Companies traditionally pay for 3 separate disconnected tools (Salesforce for CRM, Jira for sprint tasks, Toggl/Clockify for time tracking). TeamCRM merges all three into a single, cohesive platform.\n");
            sb.append("2. **Server-Authoritative Anti-Tamper Time Tracking:** Eliminates payroll and billing inflation by calculating elapsed time strictly on synchronized server clocks rather than manipulable client browser timers.\n");
            sb.append("3. **Context-Aware Gemini AI Copilot:** Native AI assistance embedded across the app that understands live database entities, explains complex sprint tasks, and generates engineering checklists.\n");
            sb.append("4. **Zero-Trust Security & RBAC:** Comprehensive role enforcement from database queries to Spring Security `@PreAuthorize` filters and frontend UI gating.\n");
            sb.append("5. **Developer-First API Catalog:** Interactive Swagger documentation that allows frontend teams and external partners to test and simulate payloads in real time.");

            items.add("Explain 3-in-1 unification (CRM + Sprint Tasks + Server Timers)");
            items.add("Highlight anti-tamper server clock architecture for interviewers");
            items.add("Demonstrate live Gemini AI Copilot query capabilities");
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 3: Users, Roles, Permissions (Admin, Manager, Employee)
        if (q.contains("role") || q.contains("admin") || q.contains("manager") || q.contains("employee") || q.contains("permission") || q.contains("payal") || q.contains("jayshree") || q.contains("rahaa") || q.contains("user") || q.contains("teams") || q.contains("team member")) {
            List<User> users = userRepository.findByIsActiveTrue();
            sb.append("👥 **Role-Based Access Control (RBAC) & Team Matrix in TeamCRM**\n\n");
            sb.append("TeamCRM enforces strict 3-tier Role-Based Access Control at both the API controller (`@PreAuthorize`) and frontend route/component levels:\n\n");

            sb.append("1. 🛡️ **ADMIN (`ROLE_ADMIN`):**\n");
            sb.append("   • **Primary Account:** `payaldjadhao@gmail.com`\n");
            sb.append("   • **Capabilities:** Unrestricted system access. Can create, edit, activate/deactivate users, change user passwords, edit/delete any meeting, reassign all sprint tasks, view full system audit logs, and access OpenAPI developer catalogs.\n\n");

            sb.append("2. 👔 **MANAGER (`ROLE_MANAGER`):**\n");
            sb.append("   • **Primary Account:** `jayshreejadhao0206@gmail.com`\n");
            sb.append("   • **Capabilities:** Team & sprint coordination. Can schedule, edit, and delete meetings, manage CRM sales deals & pipeline stages, assign tasks across team members, and view team productivity reports.\n\n");

            sb.append("3. 💻 **EMPLOYEE (`ROLE_EMPLOYEE`):**\n");
            sb.append("   • **Primary Account:** `rahaamalhotra@gmail.com`\n");
            sb.append("   • **Capabilities:** Sprint execution. Filtered view showing **only their assigned tasks**, ability to start/pause anti-tamper server timers, update task statuses (TODO → IN_PROGRESS → REVIEW → DONE), and view scheduled meetings.\n");
            sb.append("   • **Restrictions:** Cannot edit/delete meetings or modify global user configurations.\n\n");

            sb.append("**Active System Users in Database (").append(users.size()).append("):**\n");
            for (User u : users) {
                String roleName = u.getRole() != null ? u.getRole().getName().replace("ROLE_", "") : "USER";
                sb.append("• `").append(u.getEmail()).append("` — **").append(u.getFullName()).append("** (").append(roleName).append(")\n");
            }

            items.add("Enforce endpoint authorization via @PreAuthorize('hasRole(...)')");
            items.add("Conditionally hide edit/delete controls for employee session");
            items.add("Scope task queries by assignee ID for employee logins");
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 3: Pipeline Revenue / CRM Deals / Sales Metrics
        if (q.contains("revenue") || q.contains("pipeline") || q.contains("deal") || q.contains("sales") || q.contains("customer") || q.contains("lead")) {
            List<Deal> deals = dealRepository.findByIsDeletedFalseOrderByCreatedAtDesc();
            BigDecimal totalValue = deals.stream().map(Deal::getDealValue).reduce(BigDecimal.ZERO, BigDecimal::add);

            long prospectCount = deals.stream().filter(d -> "PROSPECT".equalsIgnoreCase(d.getStage())).count();
            long proposalCount = deals.stream().filter(d -> "PROPOSAL".equalsIgnoreCase(d.getStage())).count();
            long negotiationCount = deals.stream().filter(d -> "NEGOTIATION".equalsIgnoreCase(d.getStage())).count();
            long wonCount = deals.stream().filter(d -> "WON".equalsIgnoreCase(d.getStage())).count();

            BigDecimal weightedRevenue = BigDecimal.ZERO;
            for (Deal d : deals) {
                BigDecimal val = d.getDealValue() != null ? d.getDealValue() : BigDecimal.ZERO;
                if ("PROSPECT".equalsIgnoreCase(d.getStage())) weightedRevenue = weightedRevenue.add(val.multiply(BigDecimal.valueOf(0.20)));
                else if ("PROPOSAL".equalsIgnoreCase(d.getStage())) weightedRevenue = weightedRevenue.add(val.multiply(BigDecimal.valueOf(0.50)));
                else if ("NEGOTIATION".equalsIgnoreCase(d.getStage())) weightedRevenue = weightedRevenue.add(val.multiply(BigDecimal.valueOf(0.80)));
                else if ("WON".equalsIgnoreCase(d.getStage())) weightedRevenue = weightedRevenue.add(val);
            }

            sb.append("📊 **CRM Sales Funnel & Pipeline Revenue Intelligence**\n\n");
            sb.append("Pipeline Revenue aggregates all active prospective business deals progressing through TeamCRM's sales funnel before reaching closed-won.\n\n");
            sb.append("**Live Database Metrics:**\n");
            sb.append("• **Total Active Pipeline Value:** $").append(totalValue.setScale(2, RoundingMode.HALF_UP)).append(" USD across ").append(deals.size()).append(" deals\n");
            sb.append("• **Weighted Expected Revenue:** $").append(weightedRevenue.setScale(2, RoundingMode.HALF_UP)).append(" USD (factoring stage close probability)\n");
            sb.append("• **Funnel Stage Breakdown:**\n");
            sb.append("   - 🔍 Prospecting (20% conversion probability): ").append(prospectCount).append(" deals\n");
            sb.append("   - 📝 Proposal Sent (50% conversion probability): ").append(proposalCount).append(" deals\n");
            sb.append("   - 🤝 In Negotiation (80% conversion probability): ").append(negotiationCount).append(" deals\n");
            sb.append("   - 🎉 Closed-Won (100% conversion): ").append(wonCount).append(" deals\n\n");
            sb.append("**Strategic Recommendation:** High-value enterprise deals in the *Negotiation* stage represent the largest immediate conversion upside. Prioritize executive outreach on these accounts.");

            items.add("Track deal velocity through stage transition timestamps");
            items.add("Schedule executive alignment meetings for deals > $20k");
            items.add("Sync closed-won deals into client onboarding sprint tasks");
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 4: Anti-Fraud Server-Side Time Tracking
        if (q.contains("timer") || q.contains("tracking") || q.contains("time") || q.contains("clock") || q.contains("tamper") || q.contains("fraud") || q.contains("hour")) {
            sb.append("⏱️ **Server-Authoritative Anti-Tamper Time Tracking Engine**\n\n");
            sb.append("Standard browser-based timers (`setInterval`, `Date.now()`) are easily manipulated by changing the computer's system clock, suspending browser tabs, or running multiple simultaneous tabs. TeamCRM completely eliminates this fraud through a **server-authoritative timekeeping engine**:\n\n");
            sb.append("1. **Single Server Clock Authority:** When an employee clicks 'Start Timer', the Spring Boot backend records `Instant.now()` from its synchronized UTC hardware clock into the database.\n");
            sb.append("2. **Single Active Timer Rule:** An employee can have at most **ONE active timer** running across the entire organization. Starting a timer on Task B automatically pauses Task A, calculates elapsed seconds on the server, and persists the entry into `task_time_logs`.\n");
            sb.append("3. **Zero Client Manipulation:** Changing local computer time, switching timezones, or closing the tab has zero effect on the billable duration calculation.\n");
            sb.append("4. **Real-Time WebSocket STOMP Sync:** When a timer is toggled, a WebSocket broadcast synchronizes the active timer widget and pulsating topbar chip across all open devices.");

            items.add("Enforce 1 active timer constraint per user via database transaction");
            items.add("Compute billable duration exclusively on server using Instant.now()");
            items.add("Broadcast state changes via WebSocket topic /topic/timers");
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 5: Authentication, Security, OTP & Google OAuth2
        if (q.contains("auth") || q.contains("login") || q.contains("password") || q.contains("otp") || q.contains("oauth") || q.contains("jwt") || q.contains("security") || q.contains("forgot")) {
            sb.append("🔐 **Authentication, Cryptography & OAuth2 Architecture**\n\n");
            sb.append("TeamCRM utilizes a zero-trust, enterprise security architecture:\n\n");
            sb.append("• **Dual-Token Stateless JWT:** Generates 24-hour HMAC SHA-512 Access Tokens and 7-day Refresh Tokens stored securely and validated on every request via `JwtAuthenticationFilter`.\n");
            sb.append("• **Password Hashing:** Passwords are hashed with BCrypt using a cost factor of 10 and unique cryptographic salt per user.\n");
            sb.append("• **Forgot Password Flow:**\n");
            sb.append("   1. User submits registered email (must exist in database and be `@gmail.com`).\n");
            sb.append("   2. System generates a secure 6-digit OTP cached in memory with a 10-minute expiration TTL.\n");
            sb.append("   3. User submits the OTP along with old password and new password to finalize the reset.\n");
            sb.append("• **Google OAuth2 SSO:** Users can sign in with 1-click Google OAuth2. Existing accounts are authenticated instantly, and new team members are automatically provisioned with secure default role assignments.\n");
            sb.append("• **Audit Logging:** Every login, role change, and sensitive action is asynchronously recorded in the `audit_logs` table.");

            items.add("Validate JWT signature and expiration in JwtAuthenticationFilter");
            items.add("Enforce BCryptPasswordEncoder for all credentials");
            items.add("Expire OTPs after 10 minutes or upon first successful verification");
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 6: Meetings & Calendar Management
        if (q.contains("meeting") || q.contains("schedule") || q.contains("calendar") || q.contains("attendee") || q.contains("zoom") || q.contains("meet")) {
            List<Meeting> meetings = meetingRepository.findByOrderByStartTimeAsc();
            sb.append("📅 **Meeting Scheduling & Calendar Integration**\n\n");
            sb.append("The Meetings module seamlessly coordinates sales and engineering collaboration:\n\n");
            sb.append("• **Role Permissions:** Admin and Manager can create, edit, reschedule, and delete meetings. Employees have read-only access to meetings they are invited to.\n");
            sb.append("• **Direct Links:** Generates instant Google Meet or Zoom URLs linked to calendar records.\n");
            sb.append("• **Sprint & Deal Linkage:** Meetings can be tied directly to a specific Task code (e.g. CRM-101) or CRM Deal for clear context.\n\n");
            sb.append("**Upcoming Scheduled Meetings (").append(meetings.size()).append("):**\n");
            for (Meeting m : meetings) {
                sb.append("• **").append(m.getTitle()).append("** — Organizer: ").append(m.getOrganizer() != null ? m.getOrganizer().getFullName() : "System").append(" | Link: ").append(m.getMeetingLink() != null ? m.getMeetingLink() : "None").append("\n");
            }

            items.add("Validate attendee availability before confirming time slots");
            items.add("Enforce Admin/Manager authorization on edit and delete endpoints");
            items.add("Send notification alerts to all assigned meeting attendees");
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 7: System Architecture, Tech Stack & Database ERD
        if (q.contains("arch") || q.contains("stack") || q.contains("tech") || q.contains("database") || q.contains("erd") || q.contains("h2") || q.contains("postgres") || q.contains("spring") || q.contains("react")) {
            sb.append("🏗️ **TeamCRM System Architecture & Technical Specifications**\n\n");
            sb.append("• **Backend Architecture:** Spring Boot 3.3.0 running on **Java 21 LTS**, structured into Controller, Service, Repository, and Entity layers.\n");
            sb.append("• **Database:** Dual-profile JPA Hibernate configuration supporting **H2 file-based persistence** (zero-config local dev) and **PostgreSQL** (production deployment).\n");
            sb.append("• **Frontend:** **React 19** with **TypeScript**, built on Vite for sub-second hot reloading, styled with Tailwind CSS and Lucide React icons.\n");
            sb.append("• **Real-Time Communication:** Spring WebSocket with STOMP message broker for live timer synchronization and notifications.\n");
            sb.append("• **API & Contracts:** OpenAPI 3 / Swagger documentation accessible at `/swagger-ui.html`.\n");
            sb.append("• **Core Entities:** `users`, `roles`, `permissions`, `tasks`, `task_checklist_items`, `task_time_logs`, `deals`, `customers`, `leads`, `meetings`, `audit_logs`.");

            items.add("Maintain clean separation between DTOs and JPA Entities");
            items.add("Use optimistic locking (@Version) for concurrent entity updates");
            items.add("Serve OpenAPI specification via /v3/api-docs");
            return new AiResponseDto(sb.toString(), items);
        }



        // Topic 9: Checklists specifically
        if ("CHECKLIST".equalsIgnoreCase(type) || q.contains("checklist")) {
            items.addAll(generateTailoredChecklist(rawQuery, rawQuery));
            sb.append("Generated ").append(items.size()).append(" tailored engineering checklist items based on: ").append(rawQuery);
            return new AiResponseDto(sb.toString(), items);
        }

        // Topic 10: Dynamic Comprehensive Project Synthesis (Default for ANY other project query)
        List<Task> activeTasks = taskRepository.findByIsDeletedFalse();
        List<Deal> activeDeals = dealRepository.findByIsDeletedFalseOrderByCreatedAtDesc();
        List<User> activeUsers = userRepository.findByIsActiveTrue();

        sb.append("🤖 **Gemini AI Copilot — Technical Project Analysis**\n\n");
        sb.append("Here is the architectural guidance and domain analysis for: **\"").append(rawQuery).append("\"**\n\n");
        sb.append("• **Current System State:** ").append(activeTasks.size()).append(" active sprint tasks, ").append(activeDeals.size()).append(" pipeline deals, and ").append(activeUsers.size()).append(" registered team members.\n\n");
        sb.append("🛠️ **Implementation Strategy & Best Practices:**\n");
        sb.append("1. **Domain Isolation:** Ensure business logic is strictly encapsulated in `@Service` classes with `@Transactional` boundaries.\n");
        sb.append("2. **Security & Permissions:** Enforce access control across Admin (`payaldjadhao@gmail.com`), Manager (`jayshreejadhao0206@gmail.com`), and Employee (`rahaamalhotra@gmail.com`).\n");
        sb.append("3. **Auditability:** Record all entity state mutations in the central audit trail.\n");
        sb.append("4. **Responsive Frontend UI:** Implement dynamic state management with loading indicators, error boundaries, and mobile responsiveness.\n\n");
        sb.append("💡 **Tip:** You can ask about specific tasks (e.g. `CRM-101`), roles, pipeline revenue, server timers, or OAuth2 anytime!");

        items.addAll(generateTailoredChecklist(rawQuery, rawQuery));
        return new AiResponseDto(sb.toString(), items);
    }

    /**
     * Calls Google Gemini REST API using Jackson ObjectMapper, feeding full live database
     * context (RAG) and domain knowledge into the prompt.
     */
    private String callGeminiWithFullContext(String userPrompt, String keyToUse) {
        if (keyToUse == null || keyToUse.isBlank()) return null;

        // Build rich domain context for RAG
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("You are Gemini AI Copilot, the built-in intelligent assistant for TeamCRM. ");
        contextBuilder.append("TeamCRM is an enterprise software platform combining:\n");
        contextBuilder.append("1. CRM Sales Funnel (Leads, Customers, Deals with weighted pipeline forecasting)\n");
        contextBuilder.append("2. Jira-lite Sprint Task Management (CRM-101, etc. with Priorities, Multi-assignees, Checklists, Statuses: TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED)\n");
        contextBuilder.append("3. Server-Authoritative Anti-Tamper Time Tracking (UTC server clock, max 1 concurrent running timer per user, auto-pause previous timer, WebSocket STOMP sync)\n");
        contextBuilder.append("4. Role-Based Access Control: Admin (payaldjadhao@gmail.com), Manager (jayshreejadhao0206@gmail.com), Employee (rahaamalhotra@gmail.com). Employees only see their own tasks and cannot edit/delete meetings.\n");
        contextBuilder.append("5. Security: BCrypt salt cost 10, Dual JWT tokens, 6-digit OTP forgot password with 10-min TTL, Google OAuth2 SSO.\n");
        contextBuilder.append("6. Tech Stack: Spring Boot 3.3.0, Java 21, React 19, TypeScript, Tailwind CSS, H2/PostgreSQL, WebSocket STOMP, OpenAPI 3.\n\n");

        // Inject live summary of database
        try {
            List<Task> tasks = taskRepository.findByIsDeletedFalse();
            contextBuilder.append("Current Live Tasks (").append(tasks.size()).append("): ");
            for (int i = 0; i < Math.min(tasks.size(), 5); i++) {
                Task t = tasks.get(i);
                contextBuilder.append("[").append(t.getTaskCode()).append(": ").append(t.getTitle()).append(" (").append(t.getStatus()).append(")], ");
            }
            contextBuilder.append("\n");
        } catch (Exception ignored) {}

        contextBuilder.append("\nPlease answer the user's question with deep technical clarity, helpfulness, markdown formatting, and actionable steps: \n\n");
        contextBuilder.append("User Query: ").append(userPrompt);

        // Try primary model gemini-1.5-flash, fallback to gemini-2.0-flash if needed
        String[] models = {"gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"};
        for (String model : models) {
            try {
                String endpointUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + keyToUse.trim();

                Map<String, Object> textPart = Map.of("text", contextBuilder.toString());
                Map<String, Object> contentMap = Map.of("parts", List.of(textPart));
                Map<String, Object> payloadMap = Map.of("contents", List.of(contentMap));

                String requestJson = objectMapper.writeValueAsString(payloadMap);

                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .build();

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(endpointUrl))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(20))
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() == 200 && response.body() != null) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            StringBuilder answerBuilder = new StringBuilder();
                            for (JsonNode part : parts) {
                                if (part.has("text")) {
                                    answerBuilder.append(part.path("text").asText());
                                }
                            }
                            String answer = answerBuilder.toString().trim();
                            if (!answer.isEmpty()) {
                                return answer;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Gemini model " + model + " error: " + e.getMessage());
            }
        }
        return null;
    }

    private List<String> extractOrGenerateItems(String query, String geminiAnswer) {
        List<String> items = new ArrayList<>();
        // Look for markdown bullet points in the gemini answer
        String[] lines = geminiAnswer.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if ((trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) && trimmed.length() > 5) {
                String clean = trimmed.substring(1).trim();
                if (clean.length() < 120 && !clean.contains("**Strategic")) {
                    items.add(clean);
                    if (items.size() >= 5) break;
                }
            }
        }
        if (items.isEmpty()) {
            items.addAll(generateTailoredChecklist(query, query));
        }
        return items;
    }

    private Optional<Task> findReferencedTask(String input) {
        if (input == null || input.isBlank()) return Optional.empty();

        // 1. Check for CRM-XXX format (e.g. CRM-101, CRM-102)
        Matcher matcher = Pattern.compile("crm-\\d+", Pattern.CASE_INSENSITIVE).matcher(input);
        if (matcher.find()) {
            String code = matcher.group().toUpperCase();
            Optional<Task> byCode = taskRepository.findByTaskCode(code);
            if (byCode.isPresent()) return byCode;
        }

        // 2. Check for "task 1", "task #1", "task 2", "task 3"
        Matcher taskNumMatcher = Pattern.compile("task\\s*#?(\\d+)", Pattern.CASE_INSENSITIVE).matcher(input);
        if (taskNumMatcher.find()) {
            try {
                long num = Long.parseLong(taskNumMatcher.group(1));
                Optional<Task> byId = taskRepository.findById(num);
                if (byId.isPresent()) return byId;

                String code = "CRM-" + (100 + num);
                Optional<Task> byCode = taskRepository.findByTaskCode(code);
                if (byCode.isPresent()) return byCode;
            } catch (Exception ignored) {}
        }

        // 3. Check title matches among active tasks
        List<Task> activeTasks = taskRepository.findByIsDeletedFalse();
        for (Task t : activeTasks) {
            if (input.contains(t.getTitle().toLowerCase()) || input.contains(t.getTaskCode().toLowerCase())) {
                return Optional.of(t);
            }
        }

        if ((input.contains("task") || input.contains("confusion")) && !activeTasks.isEmpty()) {
            return Optional.of(activeTasks.get(0));
        }

        return Optional.empty();
    }

    private List<String> generateTailoredChecklist(String title, String desc) {
        String combined = ((title != null ? title : "") + " " + (desc != null ? desc : "")).toLowerCase();
        List<String> items = new ArrayList<>();

        if (combined.contains("auth") || combined.contains("login") || combined.contains("password") || combined.contains("otp") || combined.contains("oauth")) {
            items.add("Validate corporate/Google email format and verify user status in repository");
            items.add("Implement 6-digit cryptographic OTP generation with 10-minute TTL cache");
            items.add("Enforce BCrypt password hashing with minimum length & complexity rules");
            items.add("Issue stateless JWT access & refresh tokens on successful authentication");
            items.add("Invalidate previous sessions and record entry in system audit trail");
        } else if (combined.contains("timer") || combined.contains("tracking") || combined.contains("time") || combined.contains("clock")) {
            items.add("Enforce active timer restriction: allow only 1 concurrent running timer per employee");
            items.add("Verify server-side clock timestamps to eliminate client tampering");
            items.add("Auto-pause any existing running session upon initiating a new task timer");
            items.add("Persist final elapsed time, duration minutes, and billable rate to task_time_logs");
            items.add("Publish WebSocket STOMP notification to synchronize topbar timer widget across tabs");
        } else if (combined.contains("crm") || combined.contains("lead") || combined.contains("customer") || combined.contains("deal") || combined.contains("revenue") || combined.contains("pipeline")) {
            items.add("Verify lead qualification criteria and capture source attribution (Web, LinkedIn)");
            items.add("Link contact details with organization profile and primary account owner");
            items.add("Track deal stage transition from Qualification to Proposal and Closed-Won");
            items.add("Calculate pipeline weighted revenue and update sales forecasting dashboard");
            items.add("Trigger notification alert to assigned account manager on stage upgrade");
        } else if (combined.contains("meeting") || combined.contains("schedule") || combined.contains("calendar")) {
            items.add("Verify attendee availability and resolve potential calendar time-slot conflicts");
            items.add("Generate meeting link (Google Meet / Zoom) and associate agenda notes");
            items.add("Attach linked sprint task and milestone deliverables to meeting record");
            items.add("Send invite notifications to all assigned employee and manager attendees");
            items.add("Provide post-meeting action item checklist and summary notes recording");
        } else if (combined.contains("api") || combined.contains("doc") || combined.contains("swagger") || combined.contains("endpoint")) {
            items.add("Define OpenAPI / Swagger 3.0 specification for endpoint request & response models");
            items.add("Apply role-based access control annotations (@PreAuthorize) for Admin and Manager");
            items.add("Implement payload schema validation with @Valid and custom exception handlers");
            items.add("Simulate mock payload responses for frontend developer self-service testing");
            items.add("Publish contract to API catalog and notify frontend integration team");
        } else if (combined.contains("filter") || combined.contains("ui") || combined.contains("design") || combined.contains("frontend") || combined.contains("responsive")) {
            items.add("Design mobile-responsive container layout with fluid flexbox and hamburger drawer");
            items.add("Conditionally render role-specific filter controls (Admin/Manager vs Employee badge)");
            items.add("Bind live state filters for priority, task type, and assignee with debounced query");
            items.add("Implement smooth CSS transition animations and active state visual indicators");
            items.add("Verify zero TypeScript compile errors and test across responsive viewport widths");
        } else {
            String cleanTitle = (title != null && !title.isBlank()) ? title : "Core Feature";
            items.add("Review requirements and specify acceptance criteria for: " + cleanTitle);
            items.add("Design database schema changes, JPA entities, and repository queries");
            items.add("Implement service layer logic with transactional isolation and validation rules");
            items.add("Create RESTful controller endpoints with standard HTTP status code mappings");
            items.add("Build interactive UI components with real-time feedback and state persistence");
            items.add("Perform end-to-end testing across Admin, Manager, and Employee permissions");
        }

        return items;
    }
}
