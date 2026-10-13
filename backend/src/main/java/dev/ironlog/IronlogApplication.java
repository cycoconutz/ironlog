package dev.ironlog;

import dev.ironlog.config.DatabaseUrlSupport;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class IronlogApplication {

    public static void main(String[] args) {
        DatabaseUrlSupport.apply();
        SpringApplication.run(IronlogApplication.class, args);
    }
}
