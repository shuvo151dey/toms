package tech.smdey.toms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {


    private static final String REACT_FRONTEND_URL = System.getenv().getOrDefault("REACT_FRONTEND_URL",
            "http://localhost:3001");
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
        .addEndpoint("/ws")
        .setAllowedOriginPatterns(REACT_FRONTEND_URL)
        .withSockJS()
        ;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic/trades/{tenantId}", "/topic/orders/{tenantId}");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
