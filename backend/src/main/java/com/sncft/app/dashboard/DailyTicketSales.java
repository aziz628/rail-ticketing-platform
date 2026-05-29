package com.sncft.app.dashboard;

import java.time.LocalDate;

public record DailyTicketSales(LocalDate date, long count) {}
