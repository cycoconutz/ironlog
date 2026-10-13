package dev.ironlog.config;

import java.io.IOException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.context.annotation.Configuration;

/**
 * Serves the bundled React single-page app and falls back to {@code index.html}
 * for client-side routes, while leaving API, docs and actuator paths untouched.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(@NonNull String resourcePath, @NonNull Resource location)
                            throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        if (isBackendPath(resourcePath)) {
                            return null;
                        }
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }

    private boolean isBackendPath(String resourcePath) {
        String path = resourcePath.startsWith("/") ? resourcePath.substring(1) : resourcePath;
        return path.equals("api")
                || path.startsWith("api/")
                || path.equals("v3")
                || path.startsWith("v3/")
                || path.startsWith("swagger-ui")
                || path.startsWith("swagger-resources")
                || path.startsWith("webjars")
                || path.startsWith("actuator")
                || path.startsWith("h2-console");
    }
}
