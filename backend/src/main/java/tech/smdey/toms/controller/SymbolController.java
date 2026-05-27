package tech.smdey.toms.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.repository.SymbolRepository;

@RestController
@RequestMapping("/api/v1/symbols")
public class SymbolController {

    private final SymbolRepository symbolRepository;

    public SymbolController(SymbolRepository symbolRepository) {
        this.symbolRepository = symbolRepository;
    }

    @GetMapping
    public ResponseEntity<List<Symbol>> getAllSymbols() {
        return ResponseEntity.ok(symbolRepository.findAll());
    }
}
