package pi.integrated.certificate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.Map;

@Service
public class GeminiCertificateService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateCertificateDescription(String studentName, String courseTitle) {
        String prompt = String.format(
            "Write a formal, professional certificate achievement description (2-3 sentences) " +
            "for a student named %s who has successfully completed the course '%s'. " +
            "Mention their dedication and the skills acquired. Keep it concise and inspiring.",
            studentName, courseTitle
        );

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl + "?key=" + apiKey,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
            );

            var candidates = (List<?>) response.getBody().get("candidates");
            var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
            var parts = (List<?>) content.get("parts");
            return (String) ((Map<?, ?>) parts.get(0)).get("text");
        } catch (Exception e) {
            return studentName + " has successfully completed the course '" + courseTitle +
                   "' demonstrating outstanding dedication and commitment to learning.";
        }
    }
}
