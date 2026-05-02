package pi.integrated.jobservice.service;

import pi.integrated.jobservice.dto.NotificationDTO;
import pi.integrated.jobservice.model.Job;
import pi.integrated.jobservice.model.Notification;
import pi.integrated.jobservice.repository.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Notifie les candidats ayant postulé que l'offre a expiré.
     */
    @Transactional
    public void notifyJobExpired(Job job) {
        // This should probably be handled by an event to application-service
        // For now, we disable it to allow compilation
    }

    /**
     * Synchronise les notifications d'entretien pour tous les enseignants concernés (tâche planifiée).
     */
    @Transactional
    public void ensureTeacherNotificationsForAllTeachers() {
        // Disabled in job-service
    }

    /** Liste récente pour l'API (équivalent attendu par {@link pi.integrated.jobservice.controller.NotificationController}). */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotificationsForUser(Long userId) {
        return getRecentForUser(userId, 100);
    }

    @Transactional
    public void markAllRead(Long userId) {
        markAllAsRead(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        markAsRead(notificationId, userId);
    }

    @Transactional
    public void notifyMeetingScheduled(Long userId, Long meetingId, LocalDateTime meetingDate, String applicationInfo) {
        // Moved to application-service
    }

    @Transactional
    public void notifyTeacherMeetingScheduled(Long teacherId, Long meetingId, LocalDateTime meetingDate, String applicationInfo) {
        // Moved to application-service
    }

    @Transactional
    public void ensureTeacherNotificationsForMeetings(Long userId) {
        // Moved to application-service
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadForUser(Long userId) {
        return getUnreadForUserInternal(userId);
    }

    @Transactional
    public List<NotificationDTO> getUnreadForUserWithSync(Long userId) {
        ensureTeacherNotificationsForMeetings(userId);
        return getUnreadForUserInternal(userId);
    }

    private List<NotificationDTO> getUnreadForUserInternal(Long userId) {
        List<Notification> list = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return list.stream().map(notification -> NotificationDTO.from(notification, null, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getRecentForUser(Long userId, int limit) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, limit))
                .getContent()
                .stream().map(notification -> NotificationDTO.from(notification, null, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
