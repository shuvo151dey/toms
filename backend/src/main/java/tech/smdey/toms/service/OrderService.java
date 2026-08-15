package tech.smdey.toms.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.entity.Tenant;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.exception.OrderConstraintException;
import tech.smdey.toms.exception.SymbolNotAllowedException;
import tech.smdey.toms.repository.SymbolRepository;
import tech.smdey.toms.repository.TenantRepository;

@Service
public class OrderService {

    private SymbolRepository symbolRepository;
    private TenantRepository tenantRepository;

    @Value("${order.constraints.max-quantity:100}")
    private int maxOrderQuantity;

    @Autowired
    public OrderService(SymbolRepository symbolRepository, TenantRepository tenantRepository) {
        this.symbolRepository = symbolRepository;
        this.tenantRepository = tenantRepository;
    }

    public boolean validateOrder(TradeOrder order) {
        List<String> allowed = symbolRepository.findByTenantId(order.getTenantId()).stream()
                .map(Symbol::getTicker)
                .collect(Collectors.toList());

        if (!allowed.contains(order.getSymbol())) {
            throw new SymbolNotAllowedException("Symbol " + order.getSymbol() + " is not allowed");
        }

        if (order.getQuantity() > resolveMaxOrderQuantity(order.getTenantId())) {
            throw new OrderConstraintException("Quantity " + order.getQuantity() + " exceeds the limit");
        }

        return true;
    }

    private int resolveMaxOrderQuantity(String tenantId) {
        return tenantRepository.findByTenantId(tenantId)
                .map(Tenant::getMaxOrderQuantity)
                .filter(q -> q != null)
                .orElse(maxOrderQuantity); // global default from order.constraints.max-quantity
    }
}
