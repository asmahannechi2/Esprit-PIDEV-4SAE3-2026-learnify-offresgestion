package pi.integrated.course.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseCompletionController {

    private final RestTemplate restTemplate;

    /**
     * Called when a student finishes a course.
     * Triggers certificate generation in certificate-service.
     *
     * POST /api/courses/{courseId}/complete
     * Body: { "userId": 1, "userName": "Taher Sahbi", "userEmail": "taher@gmail.com", "courseTitle": "Java Basics" }
     */
    @PostMapping("/{courseId}/complete")
    public ResponseEntity<?> completeCourse(
            @PathVariable Long courseId,
            @RequestBody Map<String, Object> body) {

        Map<String, Object> certRequest = Map.of(
            "userId",      body.get("userId"),
            "userName",    body.get("userName"),
            "userEmail",   body.get("userEmail"),
            "courseId",    courseId,
            "courseTitle", body.getOrDefault("courseTitle", "Course #" + courseId),
            "status",      "ISSUED"
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                "http://certificate-service/api/certificates",
                HttpMethod.POST,
                new HttpEntity<>(certRequest, headers),
                Object.class
            );
            return ResponseEntity.ok(Map.of(
                "message", "Course completed! Certificate is being generated and will be sent to your email.",
                "certificate", response.getBody()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Certificate generation failed: " + e.getMessage()));
        }
    }
}
