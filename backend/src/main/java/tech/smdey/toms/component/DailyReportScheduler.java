package tech.smdey.toms.component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import tech.smdey.toms.entity.UserRole;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.repository.UserRepository;
import tech.smdey.toms.repository.TradeRepository;
import tech.smdey.toms.repository.SymbolRepository;
import tech.smdey.toms.service.EmailService;

@Component
public class DailyReportScheduler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private SymbolRepository symbolRepository;

    @Autowired
    private EmailService emailService;

    @Scheduled(cron = "0 0 18 * * *") // Runs every day at 6 PM
    public void generateDailyReport() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now();

        StringBuilder body = new StringBuilder();
        body.append("TOMS Daily Summary - ").append(LocalDate.now()).append("\n\n");

        symbolRepository.findAll().forEach(s -> {
            List<Trade> trades = tradeRepository.findTrades(s.getTicker(), "NSE", startOfDay, endOfDay);
            if (trades.isEmpty()) return;

            double volume = trades.stream().mapToDouble(t -> t.getQuantity()).sum();
            double vwap = trades.stream().mapToDouble(t -> t.getPrice() * t.getQuantity()).sum() / volume;

            body.append(s.getTicker())
                .append(": ").append(trades.size()).append(" trades")
                .append(", Volume: ").append((long) volume)
                .append(", VWAP: $").append(String.format("%.2f", vwap)).append("\n");
        });

        userRepository.findByRolesContaining(UserRole.ADMIN, "NSE").forEach(admin -> {
            emailService.sendEmail(admin.getEmail(), "Daily Report", body.toString());
        });
    }
}
