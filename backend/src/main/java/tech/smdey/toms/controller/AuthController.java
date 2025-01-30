package tech.smdey.toms.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import tech.smdey.toms.entity.User;
import tech.smdey.toms.entity.UserRole;
import tech.smdey.toms.repository.UserRepository;
import tech.smdey.toms.dto.AuthRequest;
import tech.smdey.toms.dto.AuthResponse;
import tech.smdey.toms.dto.SignupRequest;
import tech.smdey.toms.util.JwtTokenUtil;

import java.util.Collections;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        // Validate user credentials
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Generate JWT token
        String token = jwtTokenUtil.generateToken(user);

        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody SignupRequest request) {
        // Check if username or email is already taken
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        String tenantId = request.getEmail().split("@")[1].split("\\.")[0];
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setTenantId(tenantId);
        // Encode password and set default role
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRoles(Collections.singleton(UserRole.TRADER));

        // Save user
        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully");
    }
}
