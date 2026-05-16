package tech.smdey.toms.controller;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitInterceptor implements HandlerInterceptor{
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newAuthBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(5, Duration.ofMinutes(1)))
                .build();
    }

    private Bucket newOrderBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(20, Duration.ofMinutes(1)))
                .build();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        Bucket bucket;
        if (path.startsWith("/api/v1/auth")) {
            bucket = buckets.computeIfAbsent("auth:" + clientIp, k -> newAuthBucket());
        } else if (path.startsWith("/api/v1/orders")) {
            String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";
            bucket = buckets.computeIfAbsent("orders:" + username, k -> newOrderBucket());
        } else {
            return true; // No rate limit for other endpoints
        }

        if (bucket == null || bucket.tryConsume(1)) {
            return true; // Allow the request
        }
        response.setStatus(429); // Too Many Requests
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"Too many requests - please try again later.\"}");
        return false; // Reject the request
    }
    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
