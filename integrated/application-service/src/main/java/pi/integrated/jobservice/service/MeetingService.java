package pi.integrated.jobservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pi.integrated.jobservice.dto.MeetingDTO;
import pi.integrated.jobservice.dto.NextMeetingDTO;
import pi.integrated.jobservice.model.Application;
import pi.integrated.jobservice.model.Meeting;
import pi.integrated.jobservice.messaging.MeetingScheduledEventPublisher;
import pi.integrated.jobservice.client.JobClient;
import pi.integrated.jobservice.dto.JobDTO;
import pi.integrated.jobservice.repository.ApplicationRepository;
import pi.integrated.jobservice.repository.MeetingRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final MeetingScheduledEventPublisher meetingScheduledEventPublisher;
    private final JobClient jobClient;

    @Transactional
    public MeetingDTO scheduleMeeting(Long applicationId, Long evaluatorId, String evaluatorName,
                                      LocalDateTime meetingDate, Integer durationMinutes, String notes, String meetingLink) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        // Check if a meeting already exists for this application
        List<Meeting> existing = meetingRepository.findByApplicationId(applicationId);
        Meeting meeting;
        if (!existing.isEmpty()) {
            // Update the existing meeting instead of creating a new one
            meeting = existing.get(0);
            meeting.setMeetingDate(meetingDate);
            meeting.setDurationMinutes(durationMinutes != null ? durationMinutes : 60);
            meeting.setNotes(notes);
            meeting.setMeetingLink(meetingLink);
            meeting.setAssignedToId(evaluatorId);
            meeting.setAssignedToName(evaluatorName);
        } else {
            // Create new meeting
            meeting = Meeting.builder()
                .application(app)
                .assignedToId(evaluatorId)
                .assignedToName(evaluatorName)
                .meetingDate(meetingDate)
                .durationMinutes(durationMinutes != null ? durationMinutes : 60)
                .notes(notes)
                .meetingLink(meetingLink)
                .meetRoomName("learnify-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                .build();
        }

        meeting = meetingRepository.save(meeting);

        String jobTitle = null;
        try {
            JobDTO job = jobClient.getJobById(app.getJobId());
            if (job != null) jobTitle = job.getTitre();
        } catch (Exception e) {}

        notificationService.notifyTeacherMeetingScheduled(
                app.getTeacherId(), meeting.getId(), meetingDate, "Offre: " + jobTitle);

        meetingScheduledEventPublisher.publish(meeting.getId(), app.getId());

        return toDto(meeting);
    }

    public MeetingDTO updateMeeting(Long meetingId, LocalDateTime meetingDate, Integer durationMinutes, String notes, String meetingLink, Long evaluatorId,
                                  Integer scoreTechnical, Integer scoreCommunication, Integer scoreEnglish, String recommendation) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found: " + meetingId));
        if (meetingDate != null) meeting.setMeetingDate(meetingDate);
        if (durationMinutes != null) meeting.setDurationMinutes(durationMinutes);
        if (notes != null) meeting.setNotes(notes);
        if (meetingLink != null) meeting.setMeetingLink(meetingLink);
        if (evaluatorId != null) {
            meeting.setAssignedToId(evaluatorId);
        }
        if (scoreTechnical != null) meeting.setScoreTechnical(scoreTechnical);
        if (scoreCommunication != null) meeting.setScoreCommunication(scoreCommunication);
        if (scoreEnglish != null) meeting.setScoreEnglish(scoreEnglish);
        if (recommendation != null) meeting.setRecommendation(recommendation);

        return toDto(meetingRepository.save(meeting));
    }

    public void deleteMeeting(Long meetingId) {
        meetingRepository.deleteById(meetingId);
    }

    @Transactional(readOnly = true)
    public List<MeetingDTO> getAllMeetings() {
        return meetingRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<MeetingDTO> getMeetingsForApplication(Long applicationId) {
        return meetingRepository.findByApplicationId(applicationId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public MeetingDTO getMeetingByRoomName(String roomName) {
        return meetingRepository.findByMeetRoomName(roomName)
                .map(this::toDto).orElse(null);
    }

    public List<MeetingDTO> getMeetingsForTeacher(Long teacherId) {
        return meetingRepository.findByApplicationTeacherId(teacherId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<MeetingDTO> getMeetingsForEvaluator(Long evaluatorId) {
        return meetingRepository.findByAssignedToId(evaluatorId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public Optional<NextMeetingDTO> getNextMeetingForUser(Long userId) {
        return meetingRepository.findNextMeetingForUser(userId, LocalDateTime.now())
                .map(m -> NextMeetingDTO.builder()
                        .meetingId(m.getId())
                        .meetingDate(m.getMeetingDate())
                        .meetingLink(m.getMeetingLink())
                        .jobTitle(null) // title not available without extra fetch
                        .otherPartyName(m.getAssignedToName())
                        .build());
    }

    public MeetingDTO saveEvaluation(Long id, Integer tech, Integer comm, Integer eng, String recommendation, String notes) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found: " + id));
        meeting.setScoreTechnical(tech);
        meeting.setScoreCommunication(comm);
        meeting.setScoreEnglish(eng);
        meeting.setRecommendation(recommendation);
        if (notes != null) {
            meeting.setNotes(notes);
        }
        return toDto(meetingRepository.save(meeting));
    }

    private MeetingDTO toDto(Meeting m) {
        if (m == null) return null;
        return MeetingDTO.builder()
                .id(m.getId())
                .applicationId(m.getApplication().getId())
                .teacherId(m.getApplication().getTeacherId())
                .teacherName(m.getApplication().getTeacherName())
                .jobTitle(null) // title not available without extra fetch
                .assignedToId(m.getAssignedToId())
                .assignedToName(m.getAssignedToName())
                .meetingDate(m.getMeetingDate())
                .durationMinutes(m.getDurationMinutes())
                .notes(m.getNotes())
                .meetingLink(m.getMeetingLink())
                .meetRoomName(m.getMeetRoomName())
                .scoreTechnical(m.getScoreTechnical())
                .scoreCommunication(m.getScoreCommunication())
                .scoreEnglish(m.getScoreEnglish())
                .recommendation(m.getRecommendation())
                .build();
    }
}

