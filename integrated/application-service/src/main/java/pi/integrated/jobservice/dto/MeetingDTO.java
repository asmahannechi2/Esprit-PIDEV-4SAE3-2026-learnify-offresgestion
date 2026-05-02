package pi.integrated.jobservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingDTO {
    private Long id;
    private Long applicationId;
    private Long teacherId;
    private String teacherName;

    private String jobTitle;
    private Long assignedToId;
    private String assignedToName;

    private LocalDateTime meetingDate;

    /** Non stocké en base dans ce schéma — valeur d’affichage par défaut. */
    @Builder.Default
    private Integer durationMinutes = 60;
    private String notes;
    private String meetingLink;
    private String meetRoomName;

    // Evaluation data
    private Integer scoreTechnical;
    private Integer scoreCommunication;
    private Integer scoreEnglish;
    private String recommendation;
}

