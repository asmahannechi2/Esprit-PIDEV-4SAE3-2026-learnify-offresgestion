package pi.integrated.jobservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pi.integrated.jobservice.model.Application;
import pi.integrated.jobservice.model.ApplicationStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findAll();

    List<Application> findByJobId(Long jobId);

    List<Application> findByTeacherId(Long teacherId);

    Optional<Application> findByJobIdAndTeacherId(Long jobId, Long teacherId);

    List<Application> findByStatus(ApplicationStatus status);

    @org.springframework.data.jpa.repository.Query(
            "SELECT DISTINCT a.teacherId FROM Application a WHERE a.teacherId IS NOT NULL")
    List<Long> findDistinctTeacherIds();
}

