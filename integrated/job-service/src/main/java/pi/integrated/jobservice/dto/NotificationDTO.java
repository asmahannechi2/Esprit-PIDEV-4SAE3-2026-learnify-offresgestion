package pi.integrated.jobservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private Long userId;
    private String title;
    private String message;
    private String type;
    private Long meetingId;
    private LocalDateTime meetingDate;
    private String meetRoomName;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationDTO from(pi.integrated.jobservice.model.Notification n, LocalDateTime meetingDate, String roomName) {
        return NotificationDTO.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType() != null ? n.getType().name() : "GENERAL")
                .meetingId(n.getMeetingId())
                .meetingDate(meetingDate)
                .meetRoomName(roomName)
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

