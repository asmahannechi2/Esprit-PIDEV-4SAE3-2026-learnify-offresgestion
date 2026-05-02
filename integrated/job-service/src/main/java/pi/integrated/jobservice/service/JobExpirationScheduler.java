package pi.integrated.jobservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pi.integrated.jobservice.model.Job;
import pi.integrated.jobservice.model.JobStatus;
import pi.integrated.jobservice.repository.JobRepository;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobExpirationScheduler {

    private final JobRepository jobRepository;
    private final NotificationService notificationService;
    private final JobService jobService;

    /** Run every minute: expire overdue jobs. */
    @Scheduled(fixedRate = 60_000)
    public void expireJobs() {
        List<Job> expired = jobRepository.findExpiredJobs(LocalDateTime.now(java.time.ZoneOffset.UTC));
        for (Job job : expired) {
            job.setStatus(JobStatus.EXPIRED);
            jobRepository.save(job);
            notificationService.notifyJobExpired(job);
            log.info("Job expired: [{}] {}", job.getId(), job.getTitre());
        }
    }

    /** Run every minute: publish scheduled jobs. */
    @Scheduled(fixedRate = 60_000)
    public void publishScheduledJobs() {
        jobService.publishScheduledJobs();
    }

    /** Run every hour (unchanged, or maybe 15m): send reminders. */
    @Scheduled(fixedRate = 3_600_000)
    public void sendMeetingReminders() {
        notificationService.ensureTeacherNotificationsForAllTeachers();
    }
}
