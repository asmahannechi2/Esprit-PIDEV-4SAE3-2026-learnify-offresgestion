package pi.integrated.jobservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pi.integrated.jobservice.dto.CreateJobRequest;
import pi.integrated.jobservice.dto.JobWithScoreDTO;
import pi.integrated.jobservice.model.Job;
import pi.integrated.jobservice.model.JobPublicationSchedule;
import pi.integrated.jobservice.model.JobStatus;
import pi.integrated.jobservice.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final JobPublicationScheduleRepository scheduleRepository;
    private final TeacherCvProfileRepository cvProfileRepository; // Note: Used for global matching if still exists
    private final ApplicationMatchScoreService matchScoreService;
    private final SavedJobRepository savedJobRepository;

    @Transactional
    public Job createJob(CreateJobRequest req) {
        Job job = Job.builder()
                .titre(req.getTitre())
                .nbPlaces(req.getNbPlaces())
                .description(req.getDescription())
                .requirements(req.getRequirements())
                .location(req.getLocation())
                .subject(req.getSubject())
                .salaryMin(req.getSalaryMin())
                .salaryMax(req.getSalaryMax())
                .createdAt(LocalDateTime.now())
                .expiresAt(req.getExpiresAt())
                .deadline(req.getDeadline())
                .build();

        if (req.getScheduledPublicationAt() != null && req.getScheduledPublicationAt().isAfter(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
            job.setStatus(JobStatus.CLOSED);
            job = jobRepository.save(job);
            JobPublicationSchedule schedule = JobPublicationSchedule.builder()
                    .job(job)
                    .scheduledAt(req.getScheduledPublicationAt())
                    .published(false)
                    .build();
            scheduleRepository.save(schedule);
            log.info("Job scheduled for publication at UTC {}: [{}]", req.getScheduledPublicationAt(), job.getId());
        } else {
            job.setStatus(JobStatus.OPEN);
            job = jobRepository.save(job);
            log.info("Job created and published immediately (scheduledAt was null or in the past): [{}]", job.getId());
        }
        return job;
    }

    /** Mise à jour : ne remplace les champs étendus (lieu, salaires…) que s’ils sont fournis (formulaire Learn n’envoie pas ces clés). */
    @Transactional
    public Job updateJob(Long id, CreateJobRequest req) {
        Job job = getJobOrThrow(id);
        if (req.getTitre() != null) {
            job.setTitre(req.getTitre());
        }
        if (req.getNbPlaces() != null) {
            job.setNbPlaces(req.getNbPlaces());
        }
        if (req.getDescription() != null) {
            job.setDescription(req.getDescription());
        }
        if (req.getRequirements() != null) {
            job.setRequirements(req.getRequirements());
        }
        if (req.getLocation() != null) {
            job.setLocation(req.getLocation());
        }
        if (req.getSubject() != null) {
            job.setSubject(req.getSubject());
        }
        if (req.getSalaryMin() != null) {
            job.setSalaryMin(req.getSalaryMin());
        }
        if (req.getSalaryMax() != null) {
            job.setSalaryMax(req.getSalaryMax());
        }
        if (req.getExpiresAt() != null) {
            job.setExpiresAt(req.getExpiresAt());
        }
        if (req.getDeadline() != null) {
            job.setDeadline(req.getDeadline());
        }
        return jobRepository.save(job);
    }

    @Transactional
    public void deleteJob(Long id) {
        jobRepository.deleteById(id);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public Job getJobOrThrow(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found: " + id));
    }

    public List<Job> searchJobs(String titre, String location, String subject) {
        return jobRepository.searchJobs(titre, location, subject);
    }

    public List<JobWithScoreDTO> getJobsWithScoreForTeacher(Long teacherId) {
        String cvText = cvProfileRepository.findByUserId(teacherId)
                .map(p -> p.getExtractedText())
                .orElse("");

        return jobRepository.findByStatusOrderByCreatedAtDesc(JobStatus.OPEN).stream()
                .map(job -> {
                    int score = matchScoreService.computeJobMatchScoreForCvText(cvText, job);
                    boolean saved = savedJobRepository.existsByUserIdAndJobId(teacherId, job.getId());
                    boolean applied = false; // Cannot check applications from job-service without circular dep
                    return JobWithScoreDTO.builder()
                            .id(job.getId())
                            .titre(job.getTitre())
                            .nbPlaces(job.getNbPlaces())
                            .description(job.getDescription())
                            .requirements(job.getRequirements())
                            .location(job.getLocation())
                            .subject(job.getSubject())
                            .salaryMin(job.getSalaryMin())
                            .salaryMax(job.getSalaryMax())
                            .status(job.getStatus())
                            .createdAt(job.getCreatedAt())
                            .expiresAt(job.getExpiresAt())
                            .deadline(job.getDeadline())
                            .matchScore((double) score)
                            .saved(saved)
                            .applied(applied)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void publishScheduledJobs() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
        List<JobPublicationSchedule> due = scheduleRepository
                .findByPublishedFalseAndScheduledAtBefore(now);
        
        if (!due.isEmpty()) {
            log.info("Found {} jobs due for publication", due.size());
        }

        for (JobPublicationSchedule schedule : due) {
            Job job = schedule.getJob();
            if (job != null) {
                job.setStatus(JobStatus.OPEN);
                jobRepository.save(job);
                log.info("Published scheduled job: [{}] {}", job.getId(), job.getTitre());
            }
            schedule.setPublished(true);
            scheduleRepository.save(schedule);
        }
    }
}
