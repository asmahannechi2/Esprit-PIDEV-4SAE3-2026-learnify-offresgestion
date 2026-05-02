package pi.integrated.jobservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pi.integrated.jobservice.dto.ApplicationDTO;
import pi.integrated.jobservice.model.Application;
import pi.integrated.jobservice.model.ApplicationStatus;
import pi.integrated.jobservice.model.Meeting;
import pi.integrated.jobservice.client.JobClient;
import pi.integrated.jobservice.dto.JobDTO;
import pi.integrated.jobservice.repository.ApplicationRepository;
import pi.integrated.jobservice.repository.MeetingRepository;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobClient jobClient;
    private final FileStorageService fileStorageService;
    private final MeetingRepository meetingRepository;
    private final CvTextExtractionService cvTextExtractionService;
    private final ApplicationMatchScoreService matchScoreService;
    private final NotificationService notificationService;

    @Transactional
    public ApplicationDTO createApplication(Long jobId, Long teacherId, String teacherName, String motivation,
                                           MultipartFile cv, MultipartFile certificat) {
        JobDTO job = jobClient.getJobById(jobId);
        if (job == null) throw new RuntimeException("Job not found");

        if (applicationRepository.findByJobIdAndTeacherId(jobId, teacherId).isPresent()) {
            throw new RuntimeException("You have already applied to this job");
        }

        Application application = Application.builder()
                .jobId(jobId)
                .teacherId(teacherId)
                .teacherName(teacherName)
                .motivation(motivation)
                .status(ApplicationStatus.PENDING)
                .appliedAt(LocalDateTime.now())
                .build();

        if (cv != null && !cv.isEmpty()) {
            String cvPath = fileStorageService.storeFile(cv, "cv");
            application.setCvPath(cvPath);
            String extracted = cvTextExtractionService.extractText(cv);
            if (extracted != null) application.setCvExtractedText(extracted);
        }

        if (certificat != null && !certificat.isEmpty()) {
            String certPath = fileStorageService.storeFile(certificat, "certificats");
            application.setCertificatPath(certPath);
        }

        // Compute initial match score
        application.setMatchScore((double) matchScoreService.computeMatchScore(application, job));

        Application saved = applicationRepository.save(application);
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDTO> getAllApplications(String keyword, Integer minScore, String sortBy) {
        Stream<Application> stream = applicationRepository.findAll().stream();
        return applyAtsFilterAndSort(stream, keyword, minScore, sortBy);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDTO> getApplicationsByJob(Long jobId, String keyword, Integer minScore, String sortBy) {
        Stream<Application> stream = applicationRepository.findByJobId(jobId).stream();
        return applyAtsFilterAndSort(stream, keyword, minScore, sortBy);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDTO> getApplicationsByTeacher(Long teacherId) {
        return applicationRepository.findByTeacherId(teacherId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApplicationDTO getApplicationById(Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        return mapToDTO(application);
    }

    @Transactional
    public ApplicationDTO updateStatus(Long id, ApplicationStatus status) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        application.setStatus(status);
        Application updated = applicationRepository.save(application);
        
        // Clean up video pitch if accepted/rejected to save space
        if (status == ApplicationStatus.ACCEPTED || status == ApplicationStatus.REJECTED) {
            String videoPath = application.getVideoPitchPath();
            if (videoPath != null && !videoPath.isBlank()) {
                try {
                    fileStorageService.deleteFile(videoPath);
                    application.setVideoPitchPath(null);
                    applicationRepository.save(application);
                } catch (Exception e) {
                    System.err.println("WARN: Could not delete video file: " + e.getMessage());
                }
            }
        }

        Meeting autoCreatedMeeting = null;
        // Auto-create meeting if accepted (aligné Learn : salle + date J+7, notif enseignant/candidat)
        if (status == ApplicationStatus.ACCEPTED) {
            if (meetingRepository.findByApplicationId(id).isEmpty()) {
                Meeting meeting = Meeting.builder()
                        .application(application)
                        .meetRoomName("learnify-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                        .meetingDate(LocalDateTime.now().plusDays(7))
                        .build();
                autoCreatedMeeting = meetingRepository.save(meeting);

                String applicationInfo = null;
                try {
                    JobDTO job = jobClient.getJobById(application.getJobId());
                    applicationInfo = job != null ? "Offre: " + job.getTitre() : null;
                    
                    notificationService.notifyTeacherMeetingScheduled(
                            application.getTeacherId(),
                            autoCreatedMeeting.getId(),
                            autoCreatedMeeting.getMeetingDate(),
                            applicationInfo);
                } catch (Exception e) {
                    System.err.println("WARN: notification after accept failed: " + e.getMessage());
                }
            }
        }

        Application fresh = applicationRepository.findById(id).orElse(updated);
        ApplicationDTO dto = mapToDTO(fresh);
        if (autoCreatedMeeting != null) {
            dto.setScheduledMeetingId(autoCreatedMeeting.getId());
            dto.setScheduledMeetingAt(autoCreatedMeeting.getMeetingDate());
            dto.setScheduledMeetRoomName(autoCreatedMeeting.getMeetRoomName());
        }
        return dto;
    }

    @Transactional
    public ApplicationDTO updateVideoPitch(Long id, MultipartFile video) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (video != null && !video.isEmpty()) {
            String path = fileStorageService.storeFile(video, "video-pitches");
            application.setVideoPitchPath(path);
            Application saved = applicationRepository.save(application);
            return mapToDTO(saved);
        }
        throw new RuntimeException("Video file is empty");
    }

    @Transactional(readOnly = true)
    public Resource getApplicationFile(Long applicationId, String type) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        String pathStr = null;
        if ("cv".equalsIgnoreCase(type)) pathStr = application.getCvPath();
        else if ("certificat".equalsIgnoreCase(type)) pathStr = application.getCertificatPath();
        else if ("video-pitch".equalsIgnoreCase(type)) pathStr = application.getVideoPitchPath();

        if (pathStr == null || pathStr.isBlank()) {
            throw new RuntimeException("File not found for this application");
        }
        Path path = fileStorageService.loadFile(pathStr);
        if (!Files.exists(path)) {
            throw new RuntimeException("File not found on disk");
        }
        return new FileSystemResource(path.toFile());
    }

    private List<ApplicationDTO> applyAtsFilterAndSort(Stream<Application> stream, String keyword, Integer minScore, String sortBy) {
        int min = (minScore != null && minScore >= 0 && minScore <= 100) ? minScore : 0;
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        boolean sortByScore = "matchScore".equalsIgnoreCase(sortBy);

        return stream
                .filter(app -> kw == null || matchScoreService.containsKeyword(app, kw))
                .map(app -> {
                    int score = matchScoreService.computeMatchScore(app, null); // Skip detailed score if job not provided
                    if (score < min) return null;
                    ApplicationDTO dto = mapToDTO(app);
                    dto.setMatchScore((double) score);
                    return dto;
                })
                .filter(dto -> dto != null)
                .sorted(sortByScore
                        ? Comparator.comparing(ApplicationDTO::getMatchScore, Comparator.nullsLast(Comparator.reverseOrder()))
                        : Comparator.comparing(ApplicationDTO::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    private ApplicationDTO mapToDTO(Application app) {
        return ApplicationDTO.builder()
                .id(app.getId())
                .jobId(app.getJobId())
                .jobTitle(null) // title not available without extra fetch
                .teacherId(app.getTeacherId())
                .teacherName(app.getTeacherName())
                .motivation(app.getMotivation())
                .cvPath(app.getCvPath())
                .certificatPath(app.getCertificatPath())
                .videoPitchPath(app.getVideoPitchPath())
                .status(app.getStatus())
                .appliedAt(app.getAppliedAt())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .matchScore(app.getMatchScore())
                .build();
    }
}
