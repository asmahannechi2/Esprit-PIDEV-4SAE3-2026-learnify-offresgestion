package pi.integrated.jobservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateJobRequest {
    private String titre;
    private Integer nbPlaces;
    private String description;
    private String requirements;
    private String location;
    private String subject;
    private Double salaryMin;
    private Double salaryMax;
    private LocalDateTime expiresAt;
    private LocalDateTime deadline;

    /** Comme Learn : JSON peut envoyer `opensAt` à la place de ce champ. */
    @JsonAlias("opensAt")
    private LocalDateTime scheduledPublicationAt;
}
