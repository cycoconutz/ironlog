package dev.ironlog.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ironlog.jwt")
public record JwtProperties(String secret, Duration ttl) {
}
