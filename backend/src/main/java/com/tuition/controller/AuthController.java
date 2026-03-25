package com.tuition.controller;

import com.tuition.model.User;
import com.tuition.repository.UserRepository;
import com.tuition.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil        jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String username = req.getOrDefault("username", "").trim();
        String password = req.getOrDefault("password", "").trim();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }

        User user = userRepository.findByUsernameIgnoreCase(username)
                .or(() -> userRepository.findByEmailIgnoreCase(username))
                .orElse(null);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
        if (!user.getIsActive()) {
            return ResponseEntity.status(403).body(Map.of("message", "Account is disabled"));
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("id",       user.getId());
        response.put("username", user.getUsername());
        response.put("fullName", user.getFullName());
        response.put("role",     user.getRole());
        response.put("email",    user.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername()))
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        if (userRepository.existsByEmail(user.getEmail()))
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Missing token"));
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Invalid or expired token"));
        }

        return ResponseEntity.ok(Map.of(
                "valid", true,
                "username", jwtUtil.extractUsername(token),
                "role", jwtUtil.extractRole(token)
        ));
    }
}
