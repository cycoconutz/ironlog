package dev.ironlog.service;

import dev.ironlog.domain.User;
import dev.ironlog.domain.WeightUnit;
import dev.ironlog.dto.AuthDtos;
import dev.ironlog.error.ApiException;
import dev.ironlog.repo.UserRepository;
import dev.ironlog.security.JwtService;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (users.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("That email is already registered");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName());
        user.setUnit(request.unit() != null ? request.unit() : WeightUnit.KG);
        users.save(user);
        return issue(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        return issue(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.UserResponse profile(UUID userId) {
        return toResponse(require(userId));
    }

    @Transactional
    public AuthDtos.UserResponse updateProfile(UUID userId, AuthDtos.UpdateProfileRequest request) {
        User user = require(userId);
        user.setDisplayName(request.displayName());
        if (request.unit() != null) {
            user.setUnit(request.unit());
        }
        return toResponse(user);
    }

    public User require(UUID userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private AuthDtos.AuthResponse issue(User user) {
        return new AuthDtos.AuthResponse(
                jwtService.generate(user),
                "Bearer",
                jwtService.ttlSeconds(),
                toResponse(user));
    }

    public static AuthDtos.UserResponse toResponse(User user) {
        return new AuthDtos.UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getUnit(),
                user.getCreatedAt());
    }
}
