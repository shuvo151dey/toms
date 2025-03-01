package tech.smdey.toms.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import tech.smdey.toms.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository){
        this.userRepository = userRepository;
    }
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
    
    public UserDetails loadUserByUsernameAndTenantId(String username, String tenantId) throws UsernameNotFoundException {
        return userRepository.findByUsernameAndTenantId(username, tenantId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public String getTenantId(String username){
        return userRepository.findByUsername(username)
            .map(user -> user.getTenantId())
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}
