package tech.smdey.toms.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.dto.TenantSummary;
import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.entity.Tenant;
import tech.smdey.toms.repository.SymbolRepository;
import tech.smdey.toms.repository.TenantRepository;
import tech.smdey.toms.repository.UserRepository;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SymbolRepository symbolRepository;

    @GetMapping("/public")
    public ResponseEntity<List<TenantSummary>> getPublicTenants() {
        // "id" here is the tenantId business key (e.g. "NSE"), not the numeric
        // database PK — this is the exact string AuthRequest/SignupRequest.tenantId
        // must carry, since that's what User.tenantId is actually keyed on.
        List<TenantSummary> tenantSummaries = tenantRepository.findAll().stream()
            .map(tenant -> new TenantSummary(tenant.getTenantId(), tenant.getName()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(tenantSummaries);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Tenant>> getAllTenants() {
        List<Tenant> tenants = tenantRepository.findAll();
        return ResponseEntity.ok(tenants);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Tenant> createTenant(@RequestBody Tenant tenant) {
        if (tenantRepository.existsByTenantId(tenant.getTenantId())) {
            return ResponseEntity.badRequest().build();
        }
        Tenant savedTenant = tenantRepository.save(tenant);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTenant);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Tenant> updateTenant(@PathVariable Long id, @RequestBody Tenant update) {
        Tenant tenant = tenantRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        tenant.setName(update.getName());
        tenant.setMaxPosition(update.getMaxPosition());
        tenant.setMaxNotional(update.getMaxNotional());
        tenant.setDailyLossLimit(update.getDailyLossLimit());
        tenant.setMaxOrderQuantity(update.getMaxOrderQuantity());
        Tenant savedTenant = tenantRepository.save(tenant);
        return ResponseEntity.ok(savedTenant);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTenant(@PathVariable Long id) {
        Tenant tenant = tenantRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        if (userRepository.existsByTenantId(tenant.getTenantId())) {  // add this repo method
            throw new IllegalStateException("Cannot delete tenant with existing users");
        }
        tenantRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Symbol lists are nested under the tenantId business key (not the numeric
    // PK above) since that's what Symbol.tenantId / SymbolRepository are keyed on.
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{tenantId}/symbols")
    public ResponseEntity<List<Symbol>> getTenantSymbols(@PathVariable String tenantId) {
        return ResponseEntity.ok(symbolRepository.findByTenantId(tenantId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{tenantId}/symbols")
    public ResponseEntity<Symbol> addSymbol(@PathVariable String tenantId, @RequestBody Map<String, String> body) {
        String ticker = body.get("ticker");
        if (ticker == null || ticker.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (symbolRepository.existsByTickerAndTenantId(ticker, tenantId)) {
            return ResponseEntity.badRequest().build();
        }
        Symbol saved = symbolRepository.save(new Symbol(ticker, tenantId));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{tenantId}/symbols/{ticker}")
    public ResponseEntity<Void> removeSymbol(@PathVariable String tenantId, @PathVariable String ticker) {
        Symbol symbol = symbolRepository.findByTenantId(tenantId).stream()
            .filter(s -> s.getTicker().equalsIgnoreCase(ticker))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Symbol not found"));
        symbolRepository.delete(symbol);
        return ResponseEntity.noContent().build();
    }
}

