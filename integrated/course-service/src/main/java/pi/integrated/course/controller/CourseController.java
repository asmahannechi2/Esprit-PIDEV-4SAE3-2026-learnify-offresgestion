package pi.integrated.course.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import pi.integrated.course.dto.CourseRequest;
import pi.integrated.course.dto.CourseResponse;
import pi.integrated.course.service.ICourseService;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final ICourseService courseService;
    private final RestTemplate restTemplate;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    /**
     * Returns all courses with enrolled=true for courses the user has paid for.
     * GET /api/courses?userId=1
     */
    @GetMapping(params = "userId")
    public ResponseEntity<List<CourseResponse>> getAllCoursesForUser(@RequestParam Long userId) {
        List<CourseResponse> courses = courseService.getAllCourses();
        Set<Long> paidIds = getPaidCourseIds(userId);
        courses.forEach(c -> c.setEnrolled(paidIds.contains(c.getId())));
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<CourseResponse>> getCoursesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(courseService.getCoursesByCategory(category));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<List<CourseResponse>> getCoursesByLevel(@PathVariable String level) {
        return ResponseEntity.ok(courseService.getCoursesByLevel(level));
    }

    @GetMapping("/search")
    public ResponseEntity<List<CourseResponse>> searchCourses(@RequestParam String keyword) {
        return ResponseEntity.ok(courseService.searchCourses(keyword));
    }

    // Admin endpoints
    @PostMapping("/admin")
    public ResponseEntity<CourseResponse> createCourse(@RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<CourseResponse> updateCourse(@PathVariable Long id, @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @SuppressWarnings("unchecked")
    private Set<Long> getPaidCourseIds(Long userId) {
        try {
            var response = restTemplate.getForEntity(
                "http://payment-service/api/payments/user/" + userId + "/courses",
                java.util.Map.class
            );
            if (response.getBody() != null && response.getBody().get("data") instanceof List) {
                List<?> data = (List<?>) response.getBody().get("data");
                return data.stream()
                    .map(o -> Long.valueOf(o.toString()))
                    .collect(Collectors.toSet());
            }
        } catch (Exception e) {
            // payment-service unavailable — degrade gracefully
        }
        return Collections.emptySet();
    }
}
