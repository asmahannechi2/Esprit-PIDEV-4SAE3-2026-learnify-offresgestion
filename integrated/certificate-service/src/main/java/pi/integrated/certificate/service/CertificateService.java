package pi.integrated.certificate.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pi.integrated.certificate.dto.CertificateDTO;
import pi.integrated.certificate.entity.Certificate;
import pi.integrated.certificate.exception.ResourceNotFoundException;
import pi.integrated.certificate.mapper.CertificateMapper;
import pi.integrated.certificate.repository.CertificateRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final CertificateMapper certificateMapper;
    private final GeminiCertificateService geminiService;
    private final QrCodeService qrCodeService;
    private final CertificatePdfService pdfService;
    private final CertificateEmailService emailService;

    @Value("${certificate.verification-base-url}")
    private String verificationBaseUrl;

    public List<CertificateDTO> getAllCertificates() {
        return certificateRepository.findAll().stream()
                .map(certificateMapper::toDTO)
                .collect(Collectors.toList());
    }

    public CertificateDTO getCertificateById(Long id) {
        Certificate cert = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + id));
        return certificateMapper.toDTO(cert);
    }

    @Transactional
    public CertificateDTO createCertificate(CertificateDTO dto) {
        Certificate cert = certificateMapper.toEntity(dto);
        cert.setStatus("ISSUED");
        cert.setCompletionDate(LocalDateTime.now());

        // 1. Generate AI description
        String aiDesc = geminiService.generateCertificateDescription(cert.getUserName(), cert.getCourseTitle());
        cert.setAiDescription(aiDesc);

        // Save first to get certificateNumber and verificationCode generated
        cert = certificateRepository.save(cert);

        // 2. Generate QR code pointing to verification URL
        String verifyUrl = verificationBaseUrl + "/" + cert.getVerificationCode();
        byte[] qrBytes = qrCodeService.generateQrCode(verifyUrl);

        // 3. Generate PDF with QR embedded
        byte[] pdfBytes = pdfService.generatePdf(cert, qrBytes);

        // 4. Send email with PDF attached (async)
        emailService.sendCertificateEmail(cert, pdfBytes);

        return certificateMapper.toDTO(cert);
    }

    @Transactional
    public void deleteCertificate(Long id) {
        if (!certificateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Certificate not found: " + id);
        }
        certificateRepository.deleteById(id);
    }

    public Long getCertificateCount() {
        return certificateRepository.count();
    }

    public List<CertificateDTO> getCertificatesByUser(Long userId) {
        return certificateRepository.findByUserId(userId).stream()
                .map(certificateMapper::toDTO)
                .collect(Collectors.toList());
    }

    public CertificateDTO verifyByCode(String verificationCode) {
        Certificate cert = certificateRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid verification code"));
        return certificateMapper.toDTO(cert);
    }
}
