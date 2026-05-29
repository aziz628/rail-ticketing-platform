package com.sncft.app.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
    long ticketsSoldToday,
    BigDecimal totalRevenue,
    long activeSubscriptions,
    List<DailyTicketSales> dailyTicketsSold
) {}
