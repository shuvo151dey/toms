package tech.smdey.toms.service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.SymbolRepository;

@Service
public class OrderService {

    private SymbolRepository symbolRepository;

    @Autowired
    public OrderService(SymbolRepository symbolRepository) {
        this.symbolRepository = symbolRepository;
    }

    public boolean validateOrder(TradeOrder order) {
        List<String> allowed = symbolRepository.findAll().stream()
                .map(Symbol::getTicker)
                .collect(Collectors.toList());

        if (!allowed.contains(order.getSymbol())) {
            throw new IllegalArgumentException("Symbol " + order.getSymbol() + " is not allowed");
        }

        if (order.getQuantity() > 100) {
            throw new IllegalArgumentException("Quantity " + order.getQuantity() + " exceeds the limit");
        }

        return true;
    }
    
    
}
