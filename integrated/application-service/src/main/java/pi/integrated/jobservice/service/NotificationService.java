package pi.integrated.jobservice.service;

import pi.integrated.jobservice.dto.JobDTO;
import pi.integrated.jobservice.dto.NotificationDTO;
import pi.integrated.jobservice.model.*;
import pi.integrated.jobservice.client.JobClient;
import pi.integrated.jobservice.repository.ApplicationRepository;
import pi.integrated.jobservice.repository.MeetingRepository;
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
    private final MeetingRepository meetingRepository;
    private final ApplicationRepository applicationRepository;
    private final JobClient jobClient;

    public NotificationService(NotificationRepository notificationRepository,
                               MeetingRepository meetingRepository,
                               ApplicationRepository applicationRepository,
                               JobClient jobClient) {
        this.notificationRepository = notificationRepository;
        this.meetingRepository = meetingRepository;
        this.applicationRepository = applicationRepository;
        this.jobClient = jobClient;
    }

    /**
     * Notifie les candidats ayant postulé que l'offre a expiré.
     */
    @Transactional
    public void notifyJobExpired(JobDTO job) {
        if (job == null || job.getId() == null) {
            return;
        }
        String titre = job.getTitre() != null ? job.getTitre() : "Offre";
        for (Application app : applicationRepository.findByJobId(job.getId())) {
            if (app.getTeacherId() == null) {
                continue;
            }
            Notification n = new Notification();
            n.setUserId(app.getTeacherId());
            n.setType(Notification.NotificationType.JOB_EXPIRED);
            n.setTitle("Offre expirée");
            n.setMessage("L'offre « " + titre + " » n'est plus disponible.");
            n.setRead(false);
            notificationRepository.save(n);
        }
    }

    /**
     * Synchronise les notifications d'entretien pour tous les enseignants concernés (tâche planifiée).
     */
    @Transactional
    public void ensureTeacherNotificationsForAllTeachers() {
        for (Long teacherId : applicationRepository.findDistinctTeacherIds()) {
            ensureTeacherNotificationsForMeetings(teacherId);
        }
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
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(Notification.NotificationType.MEETING_SCHEDULED);
        n.setTitle("Meeting programmé");
        n.setMessage(applicationInfo != null
                ? "Un entretien a été programmé pour le " + meetingDate + " – " + applicationInfo
                : "Un entretien a été programmé pour le " + meetingDate);
        n.setMeetingId(meetingId);
        n.setRead(false);
        notificationRepository.save(n);
    }

    @Transactional
    public void notifyTeacherMeetingScheduled(Long teacherId, Long meetingId, LocalDateTime meetingDate, String applicationInfo) {
        Notification n = new Notification();
        n.setUserId(teacherId);
        n.setType(Notification.NotificationType.MEETING_SCHEDULED);
        n.setTitle("Entretien programmé – Candidature acceptée");
        n.setMessage(applicationInfo != null
                ? "Votre candidature a été acceptée. Votre entretien est programmé le " + meetingDate + " – " + applicationInfo
                : "Votre candidature a été acceptée. Votre entretien est programmé le " + meetingDate);
        n.setMeetingId(meetingId);
        n.setRead(false);
        notificationRepository.save(n);
    }

    @Transactional
    public void ensureTeacherNotificationsForMeetings(Long userId) {
        // Adapté pour utiliser le paramètre correct dans le repository
        List<Meeting> meetingsForTeacher = meetingRepository.findByApplicationTeacherId(userId);
        for (Meeting m : meetingsForTeacher) {
            if (notificationRepository.existsByUserIdAndMeetingId(userId, m.getId())) {
                continue;
            }
            String applicationInfo = null;
            if (m.getApplication() != null) {
                try {
                    JobDTO job = jobClient.getJobById(m.getApplication().getJobId());
                    if (job != null) applicationInfo = "Offre: " + job.getTitre();
                } catch (Exception e) {}
            }
            notifyTeacherMeetingScheduled(userId, m.getId(), m.getMeetingDate(), applicationInfo);
        }
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
        return list.stream().map(notification -> {
            Meeting meeting = notification.getMeetingId() == null ? null
                    : meetingRepository.findById(notification.getMeetingId()).orElse(null);
            
            LocalDateTime meetingDate = meeting != null ? meeting.getMeetingDate() : null;
            String roomName = meeting != null ? meeting.getMeetRoomName() : null;
            if (meeting != null && (roomName == null || roomName.isBlank())) {
                roomName = "learnify-" + meeting.getId() + "-" + java.util.UUID.randomUUID().toString().substring(0, 4);
            }
            
            return NotificationDTO.from(notification, meetingDate, roomName);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getRecentForUser(Long userId, int limit) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, limit))
                .getContent()
                .stream().map(notification -> {
                    Meeting meeting = notification.getMeetingId() == null ? null
                            : meetingRepository.findById(notification.getMeetingId()).orElse(null);
                    LocalDateTime meetingDate = meeting != null ? meeting.getMeetingDate() : null;
                    String roomName = meeting != null ? meeting.getMeetRoomName() : null;
                    if (meeting != null && (roomName == null || roomName.isBlank())) {
                        roomName = "learnify-" + meeting.getId() + "-" + java.util.UUID.randomUUID().toString().substring(0, 4);
                    }
                    return NotificationDTO.from(notification, meetingDate, roomName);
                }).collect(Collectors.toList());
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
