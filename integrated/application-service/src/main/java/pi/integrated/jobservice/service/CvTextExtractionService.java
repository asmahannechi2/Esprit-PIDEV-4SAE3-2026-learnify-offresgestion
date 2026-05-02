package pi.integrated.jobservice.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Locale;

/**
 * Extrait le texte des CV (PDF) pour l'indexation et le matching ATS.
 */
@Service
public class CvTextExtractionService {

    private static final int MAX_EXTRACTED_LENGTH = 50_000;
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    /**
     * Extrait le texte d'un fichier (PDF uniquement pour l'instant).
     * Retourne null en cas d'erreur ou si le type n'est pas supporté.
     */
    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String contentType = file.getContentType();
        String name = (file.getOriginalFilename() != null) ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        if (PDF_CONTENT_TYPE.equals(contentType) || name.endsWith(".pdf")) {
            return extractFromPdf(file);
        }
        return null;
    }

    private String extractFromPdf(MultipartFile file) {
        try (InputStream is = file.getInputStream();
             PDDocument document = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            if (text == null) return null;
            text = text.replaceAll("\\s+", " ").trim();
            if (text.length() > MAX_EXTRACTED_LENGTH) {
                text = text.substring(0, MAX_EXTRACTED_LENGTH);
            }
            return text.isEmpty() ? null : text;
        } catch (Exception e) {
            return null;
        }
    }
}
