package dev.ironlog.config;

import java.net.URI;

/**
 * Translates a platform-provided {@code DATABASE_URL} (Neon, Render, Heroku style
 * {@code postgres://user:pass@host/db}) into the discrete {@code spring.datasource.*}
 * system properties Spring Boot reads. System properties take precedence over
 * {@code application-prod.yml}, so this runs before the context starts.
 */
public final class DatabaseUrlSupport {

    private DatabaseUrlSupport() {
    }

    public static void apply() {
        if (notBlank(System.getProperty("spring.datasource.url"))) {
            return;
        }
        if (notBlank(System.getenv("SPRING_DATASOURCE_URL"))) {
            return;
        }
        String raw = System.getenv("DATABASE_URL");
        if (!notBlank(raw)) {
            return;
        }

        String normalized = raw.trim();
        if (normalized.startsWith("postgres://")) {
            normalized = "postgresql://" + normalized.substring("postgres://".length());
        }
        if (!normalized.startsWith("postgresql://")) {
            return;
        }

        URI uri = URI.create(normalized);
        StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                .append(uri.getHost());
        if (uri.getPort() != -1) {
            jdbc.append(':').append(uri.getPort());
        }
        String path = uri.getRawPath();
        if (path != null && path.length() > 1) {
            jdbc.append(path);
        }
        String query = uri.getRawQuery();
        if (query != null && !query.isBlank()) {
            jdbc.append('?').append(query);
        }

        System.setProperty("spring.datasource.url", jdbc.toString());

        // getUserInfo() is already percent-decoded, so read the raw form and decode
        // once ourselves. URLDecoder would also turn a literal '+' into a space,
        // silently corrupting a password that contains one.
        String userInfo = uri.getRawUserInfo();
        if (userInfo != null && !userInfo.isBlank()) {
            int sep = userInfo.indexOf(':');
            String username = sep >= 0 ? userInfo.substring(0, sep) : userInfo;
            String password = sep >= 0 ? userInfo.substring(sep + 1) : "";
            System.setProperty("spring.datasource.username", percentDecode(username));
            System.setProperty("spring.datasource.password", percentDecode(password));
        }
        System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
    }

    /** Percent-decodes %XX escapes while leaving a literal '+' untouched. */
    private static String percentDecode(String value) {
        if (value.indexOf('%') < 0) {
            return value;
        }
        StringBuilder out = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '%' && i + 2 < value.length()) {
                int hi = Character.digit(value.charAt(i + 1), 16);
                int lo = Character.digit(value.charAt(i + 2), 16);
                if (hi >= 0 && lo >= 0) {
                    out.append((char) ((hi << 4) + lo));
                    i += 2;
                    continue;
                }
            }
            out.append(c);
        }
        return out.toString();
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
