package tech.smdey.toms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import tech.smdey.toms.entity.Symbol;

public interface SymbolRepository extends JpaRepository<Symbol, Long> {
    List<Symbol> findByTenantId(String tenantId);
    boolean existsByTickerAndTenantId(String ticker, String tenantId);
}
