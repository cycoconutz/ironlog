package dev.ironlog.dto;

import dev.ironlog.domain.WeightUnit;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 80) String displayName,
            WeightUnit unit) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record UserResponse(
            UUID id,
            String email,
            String displayName,
            WeightUnit unit,
            Instant createdAt) {
    }

    public record AuthResponse(
            String token,
            String tokenType,
            long expiresInSeconds,
            UserResponse user) {
    }

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 80) String displayName,
            WeightUnit unit) {
    }
}
