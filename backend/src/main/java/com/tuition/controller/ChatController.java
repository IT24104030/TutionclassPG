package com.tuition.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${chatbot.provider:auto}")
    private String provider;

    @Value("${chatbot.openai.apiKey:}")
    private String openAiApiKey;

    @Value("${chatbot.openai.baseUrl:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    @Value("${chatbot.openai.model:gpt-4o-mini}")
    private String openAiModel;

    @Value("${chatbot.openai.temperature:0.2}")
    private double openAiTemperature;

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatRequest req) {
        String message = req == null ? "" : safeTrim(req.message);
        if (message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message is required"));
        }
        if (message.length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message is too long"));
        }

        boolean wantsRules = "rules".equalsIgnoreCase(safeTrim(provider));
        boolean openAiConfigured = !safeTrim(openAiApiKey).isEmpty();
        boolean useOpenAi = !wantsRules && openAiConfigured;

        String reply;
        String usedProvider;
        String usedModel = null;

        if (useOpenAi) {
            try {
                reply = askOpenAi(message, sanitizeHistory(req.history));
                usedProvider = "openai";
                usedModel = openAiModel;
            } catch (Exception ex) {
                log.warn("OpenAI chat failed; falling back to rules bot: {}", ex.toString());
                reply = rulesBotReply(message);
                usedProvider = "rules";
            }
        } else {
            reply = rulesBotReply(message);
            usedProvider = "rules";
        }

        return ResponseEntity.ok(new ChatResponse(reply, usedProvider, usedModel, Instant.now().toString()));
    }

    private String askOpenAi(String message, List<ChatTurn> history) throws Exception {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of(
                "role", "system",
                "content", "You are an assistant for an A/L Tuition Management web app. " +
                        "Answer briefly and practically. " +
                        "If asked about app features, explain steps in the UI (Students, Batches, Attendance, Income, Marketing, Resources, Staff, Schedule, Results). " +
                        "Do not claim you performed actions in the system."
        ));
        for (ChatTurn turn : history) {
            messages.add(Map.of("role", turn.role, "content", turn.content));
        }
        messages.add(Map.of("role", "user", "content", message));

        Map<String, Object> payload = Map.of(
                "model", openAiModel,
                "messages", messages,
                "temperature", openAiTemperature,
                "max_tokens", 450
        );

        String json = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(openAiBaseUrl + "/chat/completions"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + openAiApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("OpenAI HTTP " + response.statusCode() + ": " + safeBodySnippet(response.body()));
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
        String content = contentNode.isTextual() ? contentNode.asText() : "";
        content = safeTrim(content);
        if (content.isEmpty()) {
            throw new IllegalStateException("OpenAI returned empty response");
        }
        return content;
    }

    private List<ChatTurn> sanitizeHistory(List<ChatTurn> history) {
        if (history == null || history.isEmpty()) return List.of();
        List<ChatTurn> cleaned = new ArrayList<>();
        for (ChatTurn t : history) {
            if (t == null) continue;
            String role = safeTrim(t.role).toLowerCase(Locale.ROOT);
            if (!role.equals("user") && !role.equals("assistant")) continue;
            String content = safeTrim(t.content);
            if (content.isEmpty()) continue;
            if (content.length() > 1200) content = content.substring(0, 1200);
            cleaned.add(new ChatTurn(role, content));
        }
        int start = Math.max(0, cleaned.size() - 10);
        return cleaned.subList(start, cleaned.size());
    }

    private String rulesBotReply(String message) {
        String m = safeTrim(message).toLowerCase(Locale.ROOT);

        if (containsAny(m, "hello", "hi", "hey", "good morning", "good evening")) {
            return "Hi! I can help you with login, students, batches, attendance, schedule, payments, resources, staff, and results. " +
                    "Tell me what you want to do and I’ll give exact steps.";
        }
        if (containsAny(m, "login", "sign in", "password", "logout", "session")) {
            return "Login: open the login page, enter your username and password, then press Login. " +
                    "If you get logged out, your session token may have expired — log in again.";
        }
        if (containsAny(m, "student", "admission", "register student", "enroll student")) {
            return "Students: go to Students → Add Student, fill the required fields, and save. " +
                    "To enroll, open a student and choose a batch.";
        }
        if (containsAny(m, "batch", "class group", "new batch")) {
            return "Batches: go to Batches → Add Batch, select subject/medium/year and fee, then save. " +
                    "Batches are used for enrollments, schedules, attendance, and payments.";
        }
        if (containsAny(m, "payment", "income", "fee", "pending fee", "paid", "receipt")) {
            return "Income/Payments: go to Income → Record Payment, select Student + Batch, enter amount, and save. " +
                    "You can also mark a payment as PAID from the list.";
        }
        if (containsAny(m, "attendance", "absent", "present", "mark attendance")) {
            return "Attendance: go to Attendance, select the batch and date, then mark students present/absent and save.";
        }
        if (containsAny(m, "schedule", "class", "timetable", "time table", "reschedule")) {
            return "Schedule: go to Schedule → Add Schedule, choose batch, date, start/end times, and location or ONLINE, then save.";
        }
        if (containsAny(m, "marketing", "campaign", "lead", "intake source", "promotion")) {
            return "Marketing: create campaigns and track intake sources. Use Marketing to see which sources bring students in.";
        }
        if (containsAny(m, "resource", "upload", "download", "note", "material", "pdf", "ppt")) {
            return "Resources: go to Resources to upload notes/materials for students and batches.";
        }
        if (containsAny(m, "staff", "salary", "payroll", "task", "hr")) {
            return "Staff & HR: manage staff profiles, tasks, attendance, and payroll information from the Staff module.";
        }
        if (containsAny(m, "result", "exam", "marks", "grade", "report")) {
            return "Results: go to Results to record exam marks/grades and view performance trends.";
        }
        if (containsAny(m, "dashboard", "overview", "summary", "stats")) {
            return "Dashboard: shows total students, batches, staff, income, pending fees, and today's class summary. " +
                    "Use cards/charts to monitor daily operations quickly.";
        }
        if (containsAny(m, "api", "endpoint", "backend", "server error", "403", "401", "404")) {
            return "API troubleshooting: confirm backend is running on http://localhost:8081/api, login token is valid, and endpoint path is correct. " +
                    "401/403 usually means auth issue, 404 usually means wrong route or missing resource.";
        }
        if (containsAny(m, "database", "mysql", "backup", "restore", "sql")) {
            return "Database: the backend stores data in MySQL (see backend application.properties). " +
                    "Frontend calls the backend API, and the backend saves via JPA repositories.";
        }
        if (containsAny(m, "how to", "steps", "guide", "help", "what can you do")) {
            return "I can guide you step-by-step for: login, students, batches, attendance, schedule, payments, marketing, resources, staff, results, and basic API troubleshooting.";
        }

        return "I can help with Students, Batches, Attendance, Income/Payments, Schedule, Marketing, Resources, Staff, and Results. " +
                "Tell me what you want to do, and I’ll guide you step-by-step.";
    }

    private boolean containsAny(String text, String... keywords) {
        return Arrays.stream(keywords).anyMatch(text::contains);
    }

    private static String safeTrim(String s) {
        return s == null ? "" : s.trim();
    }

    private static String safeBodySnippet(String body) {
        if (body == null) return "";
        String b = body.replaceAll("\\s+", " ").trim();
        return b.length() <= 300 ? b : b.substring(0, 300) + "…";
    }

    public record ChatRequest(String message, List<ChatTurn> history) {}

    public record ChatTurn(String role, String content) {}

    public record ChatResponse(String reply, String provider, String model, String timestamp) {}
}
