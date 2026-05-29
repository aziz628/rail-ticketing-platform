package com.sncft.app.ticket;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.sncft.app.shared.service.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketPdfService {

    private final SpringTemplateEngine templateEngine;
    private final QrCodeService qrCodeService;

    public byte[] generateTicketPdf(TicketResponse ticket) {
        try {
            // Prepare Thymeleaf Context
            Context context = new Context();
            context.setVariable("originStation", ticket.originStationName());
            context.setVariable("destinationStation", ticket.destinationStationName());
            context.setVariable("tripDate", ticket.date().toString());
            context.setVariable("departureTime", ticket.departureTime().toString());
            context.setVariable("arrivalTime", ticket.arrivalTime().toString());
            context.setVariable("seatClass", ticket.seatClassName());
            context.setVariable("trainType", ticket.tripNumber());
            context.setVariable("finalPrice", ticket.price().toString());
            context.setVariable("ticketId", ticket.id().toString());

            
            // Generate QR Code
            String qrCodeBase64 = qrCodeService.generateQrCodeBase64(ticket.id().toString(), 200, 200);
            context.setVariable("qrCode", qrCodeBase64);

            // Process HTML Template
            String htmlContent = templateEngine.process("ticket", context);

            // Render PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(htmlContent, "/");
            builder.toStream(outputStream);
            builder.run();

            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate ticket PDF for ID: {}", ticket.id(), e);
            throw new RuntimeException("Erreur lors de la génération du billet PDF", e);
        }
    }
}
