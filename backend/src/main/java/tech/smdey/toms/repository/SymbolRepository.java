package tech.smdey.toms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tech.smdey.toms.entity.Symbol;

public interface SymbolRepository extends JpaRepository<Symbol, Long> {
}
