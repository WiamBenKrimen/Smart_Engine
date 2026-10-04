package com.smartengine;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartEngineApplication {

    public static void main(String[] args) {
        loadLocalEnv();
        SpringApplication.run(SmartEngineApplication.class, args);
    }

    private static void loadLocalEnv() {
        for (Path path : new Path[] {Path.of(".env"), Path.of("backend", ".env")}) {
            if (Files.exists(path)) {
                loadEnvFile(path);
                return;
            }
        }
    }

    private static void loadEnvFile(Path path) {
        try {
            Files.readAllLines(path).stream()
                .map(String::trim)
                .filter(line -> !line.isBlank() && !line.startsWith("#") && line.contains("="))
                .forEach(line -> {
                    int separator = line.indexOf('=');
                    String key = line.substring(0, separator).trim();
                    String value = line.substring(separator + 1).trim();
                    if (System.getenv(key) == null && System.getProperty(key) == null) {
                        System.setProperty(key, value);
                    }
                });
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot load .env file: " + path, ex);
        }
    }
}
