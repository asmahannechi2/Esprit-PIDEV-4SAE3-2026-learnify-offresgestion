package pi.integrated.jobservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pi.integrated.jobservice.model.ApplicationStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDTO {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private Long teacherId;
    private String teacherName;
    private String motivation;
    private String cvPath;
    private String certificatPath;
    private String videoPitchPath;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double matchScore;

    /** Renseigné quand un entretien est créé automatiquement à l’acceptation (comme Learn). */
    private Long scheduledMeetingId;
    private LocalDateTime scheduledMeetingAt;
    private String scheduledMeetRoomName;
}

