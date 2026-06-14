package tech.smdey.toms.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import tech.smdey.toms.util.JwtTokenUtil;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    
    @Autowired private JwtTokenUtil jwtTokenUtil;
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                String username = jwtTokenUtil.extractUsername(jwt);
                accessor.setUser(() -> username);
            }
        }
        return message;
    }
}
