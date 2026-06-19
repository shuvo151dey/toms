package tech.smdey.toms.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.exception.OrderConstraintException;
import tech.smdey.toms.exception.SymbolNotAllowedException;
import tech.smdey.toms.repository.SymbolRepository;

@Service
public class OrderService {

    private SymbolRepository symbolRepository;

    @Value("${order.constraints.max-quantity:100}")
    private int maxOrderQuantity;

    @Autowired
    public OrderService(SymbolRepository symbolRepository) {
        this.symbolRepository = symbolRepository;
    }

    public boolean validateOrder(TradeOrder order) {
        List<String> allowed = symbolRepository.findAll().stream()
                .map(Symbol::getTicker)
                .collect(Collectors.toList());

        if (!allowed.contains(order.getSymbol())) {
            throw new SymbolNotAllowedException("Symbol " + order.getSymbol() + " is not allowed");
        }

        if (order.getQuantity() > maxOrderQuantity) {
            throw new OrderConstraintException("Quantity " + order.getQuantity() + " exceeds the limit");
        }

        return true;
    }
    
    
}
