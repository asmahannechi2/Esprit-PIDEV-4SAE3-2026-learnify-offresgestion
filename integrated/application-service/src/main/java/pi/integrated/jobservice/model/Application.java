package pi.integrated.jobservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id")
    private Long jobId;

    // No JPA User entity — store as plain Long + denormalized name
    private Long teacherId;
    private String teacherName;

    @Column(columnDefinition = "TEXT")
    private String motivation;

    private String cvPath;
    
    @Column(name = "cv_extracted_text", columnDefinition = "TEXT")
    private String cvExtractedText;

    private String certificatPath;

    @Column(name = "video_pitch_path")
    private String videoPitchPath;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @org.hibernate.annotations.UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private LocalDateTime appliedAt;

    private Double matchScore;
}

