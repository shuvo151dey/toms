package tech.smdey.toms.config;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;

import java.util.Arrays;

@Configuration
public class WebConfig {

    // Comma-separated list — see SecurityConfig for why (Vercel prod + preview URLs, local dev, etc.)
    private static final String[] ALLOWED_ORIGINS = Arrays.stream(
            System.getenv().getOrDefault("REACT_FRONTEND_URL", "http://localhost:3000").split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);

    private static final Logger logger = LoggerFactory.getLogger(WebConfig.class);

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        logger.debug("CORS Configuration: Allowing requests from {}", Arrays.toString(ALLOWED_ORIGINS)); // Debug log
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Allow all endpoints
                        .allowedOrigins(ALLOWED_ORIGINS) // Allow the frontend origin(s)
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }

    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
}
