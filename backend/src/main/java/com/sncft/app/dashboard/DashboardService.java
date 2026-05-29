package com.sncft.app.dashboard;

import com.sncft.app.ticket.TicketRepository;
import com.sncft.app.ticket.TransactionRepository;
import com.sncft.app.ticket.Transaction;
import com.sncft.app.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final TicketRepository ticketRepository;
    private final TransactionRepository transactionRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardStats() {
        
        ZonedDateTime startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfDay = startOfDay.plusDays(1);
                
        // get current stats
        long ticketsSoldToday = ticketRepository.countTicketsSoldBetween(startOfDay, endOfDay);
        BigDecimal totalRevenue = transactionRepository.calculateTotalRevenue().setScale(2, RoundingMode.HALF_UP);
        long activeSubscriptions = subscriptionRepository.countActiveSubscriptions();
        
        // get list of daily tickets sold for last 30 days
        ZonedDateTime thirtyDaysAgo = startOfDay.minusDays(30);
        List<DailyTicketSales> dbSales = ticketRepository.countDailyTicketsSold(thirtyDaysAgo);
        
        // convert to map for easy lookup
        Map<LocalDate, Long> salesMap = dbSales.stream()
                .collect(Collectors.toMap(DailyTicketSales::date, DailyTicketSales::count));

        // fill in missing days with 0
        List<DailyTicketSales> dailyTicketsSold = new ArrayList<>();
        for (int i = 0; i <= 30; i++) {
            LocalDate d = thirtyDaysAgo.toLocalDate().plusDays(i);
            dailyTicketsSold.add(new DailyTicketSales(d, salesMap.getOrDefault(d, 0L)));
        }

        return new DashboardResponse(ticketsSoldToday, totalRevenue, activeSubscriptions, dailyTicketsSold);
    }

    @Transactional(readOnly = true)
    public void exportTransactionsToCsv(PrintWriter writer) {
        List<Transaction> transactions = transactionRepository.findAll();
        
        // Write CSV header
        writer.println("ID Transaction,Email Utilisateur,ID Billet/Abonnement,Type d'Achat,Montant,Type,ID Transaction PSP,Statut,Date de Creation");
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        for (Transaction t : transactions) {
            String createdAt = t.getCreatedAt() != null ? t.getCreatedAt().format(formatter) : "";
            String userEmail = t.getUser() != null ? t.getUser().getEmail() : "";
            
            writer.printf("%s,%s,%s,%s,%.2f,%s,%s,%s,%s%n",
                t.getId(),
                escapeCsv(userEmail),
                t.getTargetId(),
                t.getTargetType(),
                t.getAmount(),
                t.getType(),
                t.getPspTransactionId() != null ? t.getPspTransactionId() : "",
                t.getStatus(),
                createdAt
            );
        }
    }

    // add \ to  special characters to avoid errors 
    private String escapeCsv(String data) {
        if (data == null) return "";
        String escapedData = data.replaceAll("\\R", " ");
        if (data.contains(",") || data.contains("\"") || data.contains("'")) {
            data = data.replace("\"", "\"\"");
            escapedData = "\"" + data + "\"";
        }
        return escapedData;
    }
}
