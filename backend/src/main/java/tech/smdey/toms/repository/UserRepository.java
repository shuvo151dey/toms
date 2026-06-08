package tech.smdey.toms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import tech.smdey.toms.entity.User;
import tech.smdey.toms.entity.UserRole;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndTenantId(String username, String tenantId);
    Optional<User> findByEmailAndTenantId(String email, String tenantId);
    Optional<User> findByRefreshToken(String refreshToken);
    Optional<User> findByVerificationToken(String verificationToken);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = :role AND u.tenantId = :tenantId")
    List<User> findByRolesContaining(@Param("role") UserRole role, @Param("tenantId") String tenantId);
}
