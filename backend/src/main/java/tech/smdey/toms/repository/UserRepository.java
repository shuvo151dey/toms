package tech.smdey.toms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import tech.smdey.toms.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndTenantId(String username, String tenantId);
    Optional<User> findByEmailAndTenantId(String email, String tenantId);
    Optional<User> findByRefreshToken(String refreshToken);
}
