package pi.integrated.jobservice.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pi.integrated.jobservice.dto.JobDTO;
import pi.integrated.jobservice.model.Job;
import pi.integrated.jobservice.repository.JobRepository;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private JobService jobService;

    @Test
    void getJobById_ShouldReturnJob() {
        // Given
        Job job = new Job();
        job.setId(1L);
        job.setTitre("Software Engineer");
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));

        // When
        JobDTO result = jobService.getJobById(1L);

        // Then
        assertNotNull(result);
        assertEquals("Software Engineer", result.getTitre());
    }

    @Test
    void getJobById_NotFound_ShouldThrowException() {
        // Given
        when(jobRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> jobService.getJobById(1L));
    }
}
