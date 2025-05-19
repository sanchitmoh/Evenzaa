package com.evenza.backend.services;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.evenza.backend.model.Booking;
import com.evenza.backend.model.Ticket;
import com.evenza.backend.model.User;
import com.evenza.backend.repository.BookingRepository;
import com.evenza.backend.repository.TicketRepository;
import com.evenza.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${app.ticket.storage.path:tickets}")
    private String ticketStoragePath;
    
    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");
    
    @Transactional
    public Ticket generateTicket(String bookingId, String entityName, String venue, LocalDateTime eventDateTime) throws IOException, WriterException, DocumentException {
        // Get booking details
        System.out.println("Starting ticket generation for booking ID: " + bookingId);
        
        // Handle both numeric and string booking IDs
        Optional<Booking> bookingOpt;
        try {
            // Try to parse as Long first
            Long bookingIdLong = Long.parseLong(bookingId);
            bookingOpt = bookingRepository.findById(bookingIdLong);
            System.out.println("Looking up booking with numeric ID: " + bookingIdLong);
        } catch (NumberFormatException e) {
            // If parsing fails, try to find by string ID
            System.out.println("Booking ID is not numeric, trying string lookup: " + bookingId);
            bookingOpt = bookingRepository.findByStringId(bookingId);
        }
        
        if (bookingOpt.isEmpty()) {
            System.err.println("ERROR: Booking not found with ID: " + bookingId);
            throw new IllegalArgumentException("Booking not found with ID: " + bookingId);
        }
        
        Booking booking = bookingOpt.get();
        String userId = booking.getUserId();
        System.out.println("Found booking for user ID: " + userId);
        
        // Get user details - Handle both String and Long user IDs
        Optional<User> userOpt;
        try {
            // Try to parse as Long first (for numeric IDs)
            Long userIdLong = Long.parseLong(userId);
            userOpt = userRepository.findById(userIdLong);
            System.out.println("Looking up user with numeric ID: " + userIdLong);
        } catch (NumberFormatException e) {
            // If it's not a number, try to find by string ID
            System.out.println("User ID is not numeric, trying string lookup: " + userId);
            userOpt = userRepository.findByStringId(userId);
        }
        
        String userEmail = userOpt.map(User::getEmail).orElse("user@example.com");
        System.out.println("Using email: " + userEmail + " for ticket");
        
        // Create ticket ID
        String ticketId = UUID.randomUUID().toString();
        System.out.println("Generated ticket ID: " + ticketId);
        
        // Create QR code data (includes ticket ID and booking details for verification)
        String qrCodeData = String.format("%s:%s:%s:%s", ticketId, booking.getEntityType(), booking.getEntityId(), booking.getSeatId());
        System.out.println("QR code data: " + qrCodeData);
        
        // Parse venue if it's JSON
        String venueStr = venue;
        try {
            if (venue.startsWith("{")) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode venueNode = mapper.readTree(venue);
                if (venueNode.has("name")) {
                    venueStr = venueNode.get("name").asText();
                }
            }
        } catch (Exception e) {
            System.out.println("Could not parse venue JSON, using raw string: " + e.getMessage());
        }
        
        // Create ticket entity
        Ticket ticket = Ticket.builder()
                .id(ticketId)
                .bookingId(bookingId)
                .userId(userId)
                .userEmail(userEmail)
                .entityType(booking.getEntityType())
                .entityId(booking.getEntityId())
                .entityName(entityName)
                .seatId(booking.getSeatId())
                .qrCodeData(qrCodeData)
                .isUsed(false)
                .eventDateTime(eventDateTime)
                .venue(venueStr)
                .eventImage(booking.getEventImage())
                .createdAt(LocalDateTime.now())
                .build();
        
        System.out.println("Ticket entity created: " + ticket.toString());
                
        // Generate PDF
        try {
            String pdfPath = generateTicketPDF(ticket);
            System.out.println("PDF generated at: " + pdfPath);
            // Ensure URL uses forward slashes
            String downloadUrl = baseUrl + "/api/tickets/download/" + ticketId;
            downloadUrl = downloadUrl.replace("\\", "/");
            ticket.setPdfUrl(downloadUrl);
        } catch (Exception e) {
            System.err.println("ERROR generating PDF: " + e.getMessage());
            e.printStackTrace();
            // Continue anyway to save the ticket
        }
        
        // Save ticket
        try {
            Ticket savedTicket = ticketRepository.save(ticket);
            System.out.println("Ticket saved successfully with ID: " + savedTicket.getId());
            
            // Send email asynchronously
            CompletableFuture.runAsync(() -> {
                try {
                    sendTicketEmail(savedTicket);
                } catch (Exception e) {
                    System.err.println("Failed to send ticket email: " + e.getMessage());
                }
            });
            
            return savedTicket;
        } catch (Exception e) {
            System.err.println("ERROR saving ticket: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to rollback transaction
        }
    }
    
    private String generateTicketPDF(Ticket ticket) throws IOException, DocumentException, WriterException {
        // Create directory if it doesn't exist
        Path directory = Paths.get(ticketStoragePath);
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }
        
        // Generate PDF filename
        String pdfFilename = ticket.getId() + ".pdf";
        String pdfPath = directory.resolve(pdfFilename).toString();
        
        // Generate QR code
        ByteArrayOutputStream qrStream = generateQRCode(ticket.getQrCodeData(), 200, 200);
        Image qrCodeImage = Image.getInstance(qrStream.toByteArray());
        
        // Create PDF document - use landscape for better ticket layout
        Document document = new Document(PageSize.A5.rotate());
        PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(pdfPath));
        document.open();
        
        // Add ticket header
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, BaseColor.DARK_GRAY);
        Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.ITALIC, new BaseColor(100, 100, 100));
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.DARK_GRAY);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, BaseColor.BLACK);
        Font highlightFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, new BaseColor(44, 86, 151));
        
        // Create main containing table with border (ticket border)
        PdfPTable mainTable = new PdfPTable(1);
        mainTable.setWidthPercentage(100);
        
        // Create a cell with border for the entire ticket content
        PdfPCell mainCell = new PdfPCell();
        mainCell.setBorderWidth(2f);
        mainCell.setPadding(15f);
        mainCell.setBorderColor(new BaseColor(44, 86, 151)); // Blue border
        
        // Top section - header and event name
        Paragraph eventType = new Paragraph();
        String entityTypeFormatted = ticket.getEntityType().substring(0, 1).toUpperCase() + 
                                   ticket.getEntityType().substring(1).toLowerCase();
        eventType.add(new Chunk(entityTypeFormatted + " Ticket", titleFont));
        eventType.setAlignment(Element.ALIGN_CENTER);
        
        Paragraph eventName = new Paragraph();
        eventName.add(new Chunk(ticket.getEntityName(), highlightFont));
        eventName.setAlignment(Element.ALIGN_CENTER);
        eventName.setSpacingBefore(5f);
        eventName.setSpacingAfter(15f);
        
        // Add a horizontal separator line
        PdfPTable separator = new PdfPTable(1);
        separator.setWidthPercentage(100);
        PdfPCell separatorCell = new PdfPCell();
        separatorCell.setBorderWidthBottom(1f);
        separatorCell.setBorderColorBottom(new BaseColor(200, 200, 200));
        separatorCell.setBorderWidthTop(0);
        separatorCell.setBorderWidthLeft(0);
        separatorCell.setBorderWidthRight(0);
        separatorCell.setPaddingBottom(5f);
        separator.addCell(separatorCell);
        
        // Content table - 2 columns: details and QR code
        PdfPTable contentTable = new PdfPTable(2);
        contentTable.setWidthPercentage(100);
        contentTable.setSpacingBefore(10f);
        
        // Set column widths for content table
        float[] columnWidths = {2f, 1f};
        contentTable.setWidths(columnWidths);
        
        // Left column: ticket details
        PdfPCell detailsCell = new PdfPCell();
        detailsCell.setBorder(Rectangle.NO_BORDER);
        detailsCell.setPadding(10f);
        
        // Create the details table
        PdfPTable detailsTable = new PdfPTable(2);
        detailsTable.setWidthPercentage(100);
        
        // Add ticket details with better styling
        addStyledTableRow(detailsTable, "Venue:", ticket.getVenue(), headerFont, normalFont);
        addStyledTableRow(detailsTable, "Date:", ticket.getEventDateTime().format(DATE_FORMATTER), headerFont, normalFont);
        addStyledTableRow(detailsTable, "Time:", ticket.getEventDateTime().format(TIME_FORMATTER), headerFont, normalFont);
        addStyledTableRow(detailsTable, "Seat:", ticket.getSeatId(), headerFont, normalFont);
        addStyledTableRow(detailsTable, "Ticket ID:", ticket.getId(), headerFont, normalFont);
        
        detailsCell.addElement(detailsTable);
        
        // Right column: QR code
        PdfPCell qrCodeCell = new PdfPCell();
        qrCodeCell.setBorder(Rectangle.NO_BORDER);
        qrCodeCell.setPadding(10f);
        qrCodeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        qrCodeCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        
        qrCodeImage.setAlignment(Element.ALIGN_CENTER);
        qrCodeCell.addElement(qrCodeImage);
        
        // Add cells to content table
        contentTable.addCell(detailsCell);
        contentTable.addCell(qrCodeCell);
        
        // Footer with note
        PdfPTable footerTable = new PdfPTable(1);
        footerTable.setWidthPercentage(100);
        footerTable.setSpacingBefore(15f);
        
        PdfPCell noteCell = new PdfPCell();
        noteCell.setBorder(Rectangle.NO_BORDER);
        noteCell.setPadding(10f);
        noteCell.setBackgroundColor(new BaseColor(245, 245, 245));
        
        Paragraph note = new Paragraph();
        note.add(new Chunk("Please present this ticket at the event entrance. This ticket is valid for one entry only.", normalFont));
        note.setAlignment(Element.ALIGN_CENTER);
        noteCell.addElement(note);
        
        footerTable.addCell(noteCell);
        
        // Add all elements to the main cell
        mainCell.addElement(eventType);
        mainCell.addElement(eventName);
        mainCell.addElement(separator);
        mainCell.addElement(contentTable);
        mainCell.addElement(footerTable);
        
        // Add main cell to main table
        mainTable.addCell(mainCell);
        
        // Add main table to document
        document.add(mainTable);
        
        document.close();
        
        return pdfPath;
    }
    
    private void addStyledTableRow(PdfPTable table, String header, String value, Font headerFont, Font valueFont) {
        PdfPCell headerCell = new PdfPCell(new Phrase(header, headerFont));
        headerCell.setBorderWidth(0);
        headerCell.setPaddingLeft(5);
        headerCell.setPaddingBottom(8);
        headerCell.setPaddingTop(8);
        
        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorderWidth(0);
        valueCell.setPaddingLeft(5);
        valueCell.setPaddingBottom(8);
        valueCell.setPaddingTop(8);
        
        table.addCell(headerCell);
        table.addCell(valueCell);
    }
    
    private ByteArrayOutputStream generateQRCode(String data, int width, int height) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        
        return outputStream;
    }
    
    private void sendTicketEmail(Ticket ticket) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(ticket.getUserEmail());
            helper.setSubject("Your Ticket for " + ticket.getEntityName());
            
            String emailContent = 
                    "<html><body>" +
                    "<h1>Your Ticket is Ready!</h1>" +
                    "<p>Thank you for booking with Evenza.</p>" +
                    "<p>Event: <strong>" + ticket.getEntityName() + "</strong></p>" +
                    "<p>Date: <strong>" + ticket.getEventDateTime().format(DATE_FORMATTER) + "</strong></p>" +
                    "<p>Time: <strong>" + ticket.getEventDateTime().format(TIME_FORMATTER) + "</strong></p>" +
                    "<p>Venue: <strong>" + ticket.getVenue() + "</strong></p>" +
                    "<p>Seat: <strong>" + ticket.getSeatId() + "</strong></p>" +
                    "<p>Your ticket is attached to this email. You can also download it from your profile.</p>" +
                    "<p>Please present this ticket at the event entrance.</p>" +
                    "<p>Enjoy the event!</p>" +
                    "</body></html>";
            
            helper.setText(emailContent, true);
            
            FileSystemResource file = new FileSystemResource(new File(ticket.getPdfUrl()));
            helper.addAttachment("ticket.pdf", file);
            
            javaMailSender.send(message);
        } catch (MessagingException e) {
            // Log error but don't fail the transaction
            e.printStackTrace();
        }
    }
    
    public List<Ticket> getUserTickets(String userId) {
        return ticketRepository.findUserTicketsOrderByCreationDesc(userId);
    }
    
    public List<Ticket> getUpcomingTicketsByUserId(String userId) {
        return ticketRepository.findUpcomingTicketsByUserId(userId, LocalDateTime.now());
    }
    
    public List<Ticket> getPastTicketsByUserId(String userId) {
        return ticketRepository.findPastTicketsByUserId(userId, LocalDateTime.now());
    }
    
    public Optional<Ticket> getTicketById(String ticketId) {
        return ticketRepository.findById(ticketId);
    }
    
    @Transactional
    public boolean validateTicket(String ticketId) {
        Optional<Ticket> ticketOpt = ticketRepository.findByIdAndIsUsedFalse(ticketId);
        
        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();
            
            // Check if event date is valid
            if (ticket.getEventDateTime().isAfter(LocalDateTime.now())) {
                // Mark as used
                ticket.markAsUsed();
                ticketRepository.save(ticket);
                return true;
            }
        }
        
        return false;
    }
    
    public String getTicketPdfPath(String ticketId) {
        return Paths.get(ticketStoragePath, ticketId + ".pdf").toString();
    }
    
    /**
     * Get tickets by booking ID
     */
    @Cacheable(value = "tickets", key = "'booking:' + #bookingId")
    public List<Ticket> getTicketsByBookingId(String bookingId) {
        return ticketRepository.findByBookingId(bookingId);
    }
} 