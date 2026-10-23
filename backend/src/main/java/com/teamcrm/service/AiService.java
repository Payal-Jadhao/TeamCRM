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

        // 1. If user query references a sprint task, provide live context to the LLM so it elaborates on the real task dynamically
        String llmPrompt = rawQuery;
        Optional<Task> matchedTask = findReferencedTask(normalizedQuery);
        if (matchedTask.isPresent()) {
            Task t = matchedTask.get();
            llmPrompt = "User Query: " + rawQuery + "\n\nTask Context from TeamCRM database:\n" +
                    "- Task Code: " + t.getTaskCode() + "\n" +
                    "- Title: " + t.getTitle() + "\n" +
                    "- Description: " + (t.getDescription() != null ? t.getDescription() : "Core sprint feature") + "\n" +
                    "- Priority: " + t.getPriority() + " | Status: " + t.getStatus() + "\n" +
                    "- Assignee: " + (t.getAssigneeNames() != null ? t.getAssigneeNames() : "Unassigned") + "\n\n" +
                    "Please provide a thorough, professional, and practical elaboration or answer addressing the user's query about this task.";
        }

        // 2. If Gemini API key is provided, attempt live Google Generative Language call with full RAG context
        if (effectiveApiKey != null && !effectiveApiKey.isBlank()) {
            String geminiAnswer = callGeminiWithFullContext(llmPrompt, effectiveApiKey);
            if (geminiAnswer != null && !geminiAnswer.isBlank()) {
                if ("CHECKLIST".equalsIgnoreCase(type)) {
                    items.addAll(extractOrGenerateItems(rawQuery, geminiAnswer));
                }
                return new AiResponseDto(geminiAnswer, items);
            }
        }

        // 3. Real-time Live AI Engine: Generates dynamic, intelligent answers on the fly
        String liveAiAnswer = callLiveLlm(llmPrompt);
        if (liveAiAnswer != null && !liveAiAnswer.isBlank()) {
            if ("CHECKLIST".equalsIgnoreCase(type)) {
                items.addAll(extractOrGenerateItems(rawQuery, liveAiAnswer));
            }
            return new AiResponseDto(liveAiAnswer, items);
        }

        // 4. Fallback only if offline/network failure
        return generateAgenticResponse(rawQuery, normalizedQuery, type);
    }

    /**
     * Conversational Agentic Engine: Acts as a real, helpful AI Chatbot.
     * Answers greetings, general questions, task elaborations, coding help, and TeamCRM project queries.
     */
    private AiResponseDto generateAgenticResponse(String rawQuery, String q, String type) {
        List<String> items = new ArrayList<>();
        StringBuilder sb = new StringBuilder();

        // Check if explicit checklist is requested (e.g. from TasksPage modal)
        if ("CHECKLIST".equalsIgnoreCase(type)) {
            items.addAll(generateTailoredChecklist(rawQuery, rawQuery));
            sb.append("Generated ").append(items.size()).append(" tailored engineering checklist items based on: ").append(rawQuery);
            return new AiResponseDto(sb.toString(), items);
        }

        // Empty query check
        if (q.isBlank()) {
            return new AiResponseDto("Hi there! How can I help you today?", Collections.emptyList());
        }

        // 1. Natural Conversational Greetings & Small Talk
        if (q.contains("how are you") || q.equals("how're you") || q.equals("how are you doing")) {
            return new AiResponseDto("I'm doing well, thanks for asking! How about you? Is there anything on your mind today, or something I can help with?", Collections.emptyList());
        }
        if (q.equals("hi") || q.equals("hello") || q.equals("hey") || q.equals("hi there") || q.equals("greetings")) {
            return new AiResponseDto("Hi there! How can I help you today?", Collections.emptyList());
        }
        if (q.equals("good morning")) {
            return new AiResponseDto("Good morning! How can I help you today?", Collections.emptyList());
        }
        if (q.equals("good afternoon")) {
            return new AiResponseDto("Good afternoon! How can I help you today?", Collections.emptyList());
        }
        if (q.equals("good evening")) {
            return new AiResponseDto("Good evening! How can I help you today?", Collections.emptyList());
        }
        if (q.equals("what's up") || q.equals("whats up") || q.equals("sup")) {
            return new AiResponseDto("Not much, just here and ready to help! What's on your mind today?", Collections.emptyList());
        }
        if (q.equals("thank you") || q.equals("thanks") || q.contains("thank you") || q.equals("thx")) {
            return new AiResponseDto("You're very welcome! Let me know if you need help with anything else.", Collections.emptyList());
        }

        // Fallback for general questions if the live AI language model is unreachable
        return new AiResponseDto("I am currently unable to reach the live AI language model. Please check your internet connection or configure your Google Gemini API key in the widget settings.", Collections.emptyList());
    }

    private boolean isGreeting(String q) {
        if (q == null) return false;
        String trimmed = q.replaceAll("[!.,?\\s]+", " ").trim();
        return trimmed.equals("hi") || trimmed.equals("hello") || trimmed.equals("hey") ||
               trimmed.equals("greetings") || trimmed.equals("good morning") ||
               trimmed.equals("good afternoon") || trimmed.equals("good evening") ||
               trimmed.equals("how are you") || trimmed.equals("what's up") ||
               trimmed.equals("whats up") || trimmed.startsWith("hi ") ||
               trimmed.startsWith("hello ") || trimmed.startsWith("hey ");
    }

    /**
     * Calls Google Gemini REST API using Jackson ObjectMapper, feeding full live database
     * context (RAG) and domain knowledge into the prompt.
     */
    private String callGeminiWithFullContext(String userPrompt, String keyToUse) {
        if (keyToUse == null || keyToUse.isBlank()) return null;

        // Build rich domain context for RAG
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("You are Gemini AI Chatbot, a friendly, versatile, and highly intelligent AI assistant integrated into TeamCRM.\n");
        contextBuilder.append("You can answer ANY question the user asks:\n");
        contextBuilder.append("• If the user greets you (Hi, Hello, Hey, etc.), respond warmly and conversationally.\n");
        contextBuilder.append("• If the user asks to elaborate on a task (e.g. 'elaborate on task 1', 'explain CRM-101', etc.), provide an insightful, structured elaboration with objectives, architecture, step-by-step implementation, and edge cases.\n");
        contextBuilder.append("• If the user asks general questions (coding, algorithms, technology, math, architecture, etc.), answer clearly and conversationally.\n");
        contextBuilder.append("• If the user asks about TeamCRM, use the project context below to provide accurate details.\n");
        contextBuilder.append("• Maintain a professional, helpful tone in clear English. Keep formatting clean with GitHub Markdown.\n\n");

        contextBuilder.append("=== TeamCRM Project Context ===\n");
        contextBuilder.append("1. CRM Sales Funnel: Leads, Customers, Deals with weighted pipeline forecasting.\n");
        contextBuilder.append("2. Sprint Task Management: Tasks (CRM-101, etc.) with Priorities, Multi-assignees, Checklists, Statuses: TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED.\n");
        contextBuilder.append("3. Server-Authoritative Anti-Tamper Time Tracking: UTC server clock, max 1 active timer per user, auto-pause previous timer, WebSocket STOMP sync.\n");
        contextBuilder.append("4. Role-Based Access Control: Admin (payaldjadhao@gmail.com), Manager (jayshreejadhao0206@gmail.com), Employee (rahaamalhotra@gmail.com). Employees only see assigned tasks.\n");
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

        contextBuilder.append("\nUser Message: ").append(userPrompt);

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

    /**
     * Calls real-time zero-config live LLM engine to generate dynamic, intelligent answers on the fly.
     */
    private String callLiveLlm(String userPrompt) {
        String[] models = new String[]{"openai-fast", "openai"};
        for (String model : models) {
            try {
                String systemPrompt = "You are Gemini AI Chatbot, an intelligent and versatile AI assistant integrated into TeamCRM. Answer naturally, helpfully, and conversationally in English with clean GitHub Markdown. When asked to elaborate on a sprint task, write a comprehensive, customized technical elaboration specific to that task (architecture, JPA schema, service business logic, edge cases, and test strategy).";

                Map<String, Object> sysMsg = Map.of("role", "system", "content", systemPrompt);
                Map<String, Object> userMsg = Map.of("role", "user", "content", userPrompt);
                Map<String, Object> payload = Map.of(
                        "messages", List.of(sysMsg, userMsg),
                        "model", model
                );
                String jsonBody = objectMapper.writeValueAsString(payload);

                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(12))
                        .followRedirects(HttpClient.Redirect.ALWAYS)
                        .build();

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://text.pollinations.ai/"))
                        .header("Content-Type", "application/json")
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .timeout(Duration.ofSeconds(55))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() == 200 && response.body() != null && !response.body().isBlank()) {
                    return response.body().trim();
                }
            } catch (Exception e) {
                System.err.println("Live LLM POST (" + model + ") error: " + e.getMessage());
            }
        }

        // Fast GET fallback
        try {
            String encoded = java.net.URLEncoder.encode(userPrompt, StandardCharsets.UTF_8);
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest getReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://text.pollinations.ai/" + encoded + "?model=openai-fast"))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(Duration.ofSeconds(25))
                    .GET()
                    .build();
            HttpResponse<String> getRes = client.send(getReq, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (getRes.statusCode() == 200 && getRes.body() != null && !getRes.body().isBlank()) {
                return getRes.body().trim();
            }
        } catch (Exception ignored) {}

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
