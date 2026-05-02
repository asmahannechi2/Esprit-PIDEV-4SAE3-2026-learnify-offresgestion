package pi.integrated.jobservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import pi.integrated.jobservice.dto.JobDTO;

@FeignClient(name = "job-service", url = "http://localhost:8088")
public interface JobClient {

    @GetMapping("/api/jobs/{id}")
    JobDTO getJobById(@PathVariable("id") Long id);
}
