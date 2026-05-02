package pi.integrated.certificate.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Table;
import org.springframework.stereotype.Service;
import pi.integrated.certificate.entity.Certificate;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class CertificatePdfService {

    private static final DeviceRgb GOLD = new DeviceRgb(212, 175, 55);
    private static final DeviceRgb DARK_BLUE = new DeviceRgb(13, 27, 62);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("MMMM dd, yyyy");

    public byte[] generatePdf(Certificate cert, byte[] qrCodeBytes) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, PageSize.A4.rotate());
            doc.setMargins(40, 60, 40, 60);

            // Title
            doc.add(new Paragraph("CERTIFICATE OF COMPLETION")
                .setFontSize(28).setBold()
                .setFontColor(DARK_BLUE)
                .setTextAlignment(TextAlignment.CENTER));

            doc.add(new Paragraph("This is to certify that")
                .setFontSize(14).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(20));

            // Student name
            doc.add(new Paragraph(cert.getUserName())
                .setFontSize(32).setBold()
                .setFontColor(GOLD)
                .setTextAlignment(TextAlignment.CENTER));

            doc.add(new Paragraph("has successfully completed the course")
                .setFontSize(14).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));

            // Course title
            doc.add(new Paragraph(cert.getCourseTitle())
                .setFontSize(22).setBold()
                .setFontColor(DARK_BLUE)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(10));

            // Separator
            SolidLine line = new SolidLine(1f);
            line.setColor(GOLD);
            doc.add(new LineSeparator(line).setWidth(UnitValue.createPercentValue(60))
                .setMarginBottom(15));

            // AI description
            if (cert.getAiDescription() != null) {
                doc.add(new Paragraph(cert.getAiDescription())
                    .setFontSize(11).setItalic()
                    .setFontColor(ColorConstants.DARK_GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));
            }

            // Details table + QR code side by side
            Table layout = new Table(new float[]{3, 1}).setWidth(UnitValue.createPercentValue(100));

            // Left: details
            StringBuilder details = new StringBuilder();
            details.append("Certificate No: ").append(cert.getCertificateNumber()).append("\n");
            details.append("Issue Date: ").append(cert.getIssueDate() != null ? cert.getIssueDate().format(FMT) : "").append("\n");
            details.append("Verification Code: ").append(cert.getVerificationCode());

            Cell detailsCell = new Cell().add(new Paragraph(details.toString())
                .setFontSize(10).setFontColor(ColorConstants.GRAY))
                .setBorder(null).setPaddingTop(10);
            layout.addCell(detailsCell);

            // Right: QR code
            if (qrCodeBytes != null) {
                Image qr = new Image(ImageDataFactory.create(qrCodeBytes))
                    .setWidth(80).setHeight(80);
                Cell qrCell = new Cell().add(qr).setBorder(null)
                    .setTextAlignment(TextAlignment.RIGHT);
                layout.addCell(qrCell);
            }

            doc.add(layout);
            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate certificate PDF", e);
        }
    }
}
