package pi.integrated.jobservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String title;
    private String message;
    
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private Long meetingId;

    @Column(name = "is_read")
    private boolean isRead;

    @org.hibernate.annotations.CreationTimestamp
    private LocalDateTime createdAt;

    public enum NotificationType {
        MEETING_SCHEDULED,
        JOB_EXPIRED,
        GENERAL
    }
}

