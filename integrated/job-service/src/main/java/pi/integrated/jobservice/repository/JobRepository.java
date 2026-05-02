package pi.integrated.jobservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pi.integrated.jobservice.model.Job;
import pi.integrated.jobservice.model.JobStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByStatusOrderByCreatedAtDesc(JobStatus status);

    @Query("SELECT j FROM Job j WHERE j.status = 'OPEN' AND (j.expiresAt < :now OR j.deadline < :now)")
    List<Job> findExpiredJobs(LocalDateTime now);

    @Query("SELECT j FROM Job j WHERE " +
           "(:titre IS NULL OR LOWER(j.titre) LIKE LOWER(CONCAT('%', :titre, '%'))) AND " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:subject IS NULL OR LOWER(j.subject) LIKE LOWER(CONCAT('%', :subject, '%')))")
    List<Job> searchJobs(String titre, String location, String subject);
}

