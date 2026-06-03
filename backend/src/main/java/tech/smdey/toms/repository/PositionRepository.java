package tech.smdey.toms.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import tech.smdey.toms.entity.Position;

public interface PositionRepository extends JpaRepository<Position, Long> {
    Optional<Position> findByUsernameAndSymbolAndTenantId(String username, String symbol, String tenantId);
    List<Position> findByUsernameAndTenantId(String username, String tenantId);
}
