package tech.smdey.toms.component;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.repository.SymbolRepository;

@Component
public class SymbolSeed implements ApplicationRunner {
    private final SymbolRepository symbolRepository;

    @Autowired
    public SymbolSeed(SymbolRepository symbolRepository) {
        this.symbolRepository = symbolRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (symbolRepository.count() == 0) {
            symbolRepository.saveAll(List.of(
                    new Symbol("AAPL"),
                    new Symbol("GOOGL"),
                    new Symbol("MSFT")
            ));
        }
    }
}