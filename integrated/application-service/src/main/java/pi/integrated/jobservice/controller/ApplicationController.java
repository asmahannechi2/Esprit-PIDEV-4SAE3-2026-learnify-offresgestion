package pi.integrated.jobservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pi.integrated.jobservice.dto.ApplicationDTO;
import pi.integrated.jobservice.model.ApplicationStatus;
import pi.integrated.jobservice.service.ApplicationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping("/debug-auth")
    public ResponseEntity<Map<String, Object>> debugAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return ResponseEntity.ok(Map.of("status", "no auth"));
        return ResponseEntity.ok(Map.of(
            "name", auth.getName(),
            "authorities", auth.getAuthorities(),
            "authenticated", auth.isAuthenticated()
        ));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationDTO> apply(
            @RequestParam Long jobId,
            @RequestParam(required = false) String motivation,
            @RequestParam(required = false) MultipartFile cv,
            @RequestParam(required = false) MultipartFile certificat,
            HttpServletRequest request) {
        // userId and userName are typically extracted from JWT and placed in attributes by a filter/interceptor
        Long teacherId = (Long) request.getAttribute("userId");
        String teacherName = (String) request.getAttribute("userName");
        if (teacherId == null) {
            // Fallback for development if not behind gateway
            teacherId = 1L;
            teacherName = "Dev Teacher";
        }
        return ResponseEntity.ok(
                applicationService.createApplication(jobId, teacherId, teacherName, motivation, cv, certificat));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ApplicationDTO>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) String sortBy) {
        return ResponseEntity.ok(applicationService.getAllApplications(keyword, minScore, sortBy));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ApplicationDTO>> getByJob(
            @PathVariable Long jobId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) String sortBy) {
        return ResponseEntity.ok(applicationService.getApplicationsByJob(jobId, keyword, minScore, sortBy));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ApplicationDTO>> myApplications(HttpServletRequest request) {
        Long teacherId = (Long) request.getAttribute("userId");
        if (teacherId == null) teacherId = 1L; // Dev fallback
        return ResponseEntity.ok(applicationService.getApplicationsByTeacher(teacherId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDTO> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApplicationDTO> updateStatusPut(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status) {
        return ResponseEntity.ok(applicationService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApplicationDTO> updateStatusPatch(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status) {
        return ResponseEntity.ok(applicationService.updateStatus(id, status));
    }

    @PostMapping(value = "/{id}/video-pitch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApplicationDTO> uploadVideoPitch(
            @PathVariable Long id,
            @RequestParam("video") MultipartFile video) {
        return ResponseEntity.ok(applicationService.updateVideoPitch(id, video));
    }

    @GetMapping("/{id}/files/{type}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long id,
            @PathVariable String type) {
        Resource resource = applicationService.getApplicationFile(id, type);
        String contentType = "application/octet-stream";
        if (type.equalsIgnoreCase("cv") || type.equalsIgnoreCase("certificat")) {
            contentType = "application/pdf";
        } else if (type.equalsIgnoreCase("video-pitch")) {
            contentType = "video/webm";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
