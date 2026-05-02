package pi.integrated.jobservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Colonne SQL `titre` (schéma Learnify / backend Learn). */
    @Column(nullable = false)
    private String titre;

    private Integer nbPlaces;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    private String location;
    private String subject;

    private Double salaryMin;
    private Double salaryMax;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @org.hibernate.annotations.CreationTimestamp
    private LocalDateTime createdAt;
    
    private LocalDateTime expiresAt;
    private LocalDateTime deadline;


    // applications removed for service independence
}
