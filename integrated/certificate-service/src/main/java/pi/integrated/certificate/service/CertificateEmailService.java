package pi.integrated.certificate.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import pi.integrated.certificate.entity.Certificate;

@Service
@RequiredArgsConstructor
public class CertificateEmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendCertificateEmail(Certificate cert, byte[] pdfBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(cert.getUserEmail());
            helper.setSubject("🎓 Your Certificate of Completion - " + cert.getCourseTitle());
            helper.setText(buildEmailBody(cert), true);
            helper.addAttachment("certificate_" + cert.getCertificateNumber() + ".pdf", 
                () -> new java.io.ByteArrayInputStream(pdfBytes),
                "application/pdf");

            mailSender.send(message);
        } catch (Exception e) {
            // Log but don't fail the whole flow
            System.err.println("Failed to send certificate email: " + e.getMessage());
        }
    }

    private String buildEmailBody(Certificate cert) {
        return """
            <html><body style="font-family: Arial, sans-serif; color: #333;">
              <div style="max-width:600px;margin:auto;padding:30px;border:2px solid #d4af37;border-radius:10px;">
                <h1 style="color:#0d1b3e;text-align:center;">🎓 Congratulations, %s!</h1>
                <p style="font-size:16px;text-align:center;">
                  You have successfully completed <strong>%s</strong>.
                </p>
                <p style="color:#666;text-align:center;font-style:italic;">%s</p>
                <hr style="border-color:#d4af37;"/>
                <p><strong>Certificate No:</strong> %s</p>
                <p><strong>Verification Code:</strong> %s</p>
                <p style="color:#888;font-size:12px;">
                  Your certificate PDF is attached. Scan the QR code on the certificate to verify it online.
                </p>
              </div>
            </body></html>
            """.formatted(
                cert.getUserName(), cert.getCourseTitle(),
                cert.getAiDescription() != null ? cert.getAiDescription() : "",
                cert.getCertificateNumber(), cert.getVerificationCode()
            );
    }
}
