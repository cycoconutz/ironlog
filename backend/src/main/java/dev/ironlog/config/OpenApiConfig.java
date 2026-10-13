package dev.ironlog.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI ironlogOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("IronLog API")
                        .version("v1")
                        .description("""
                                Workout and fitness logging API. Tracks training sessions, exercises,
                                sets, and derives analytics such as weekly volume, muscle-group
                                distribution, streaks and estimated one-rep-max personal records.

                                Authenticate with `POST /api/auth/register` or `POST /api/auth/login`,
                                then send the returned token as `Authorization: Bearer <token>`.
                                """)
                        .license(new License().name("MIT")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
