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
import org.springframework.web.multipart.MultipartFile;
import pi.integrated.jobservice.client.JobClient;
import pi.integrated.jobservice.dto.ApplicationDTO;
import pi.integrated.jobservice.dto.JobDTO;
import pi.integrated.jobservice.model.Application;
import pi.integrated.jobservice.repository.ApplicationRepository;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobClient jobClient;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private CvTextExtractionService cvTextExtractionService;

    @Mock
    private ApplicationMatchScoreService matchScoreService;

    @InjectMocks
    private ApplicationService applicationService;

    private JobDTO mockJob;

    @BeforeEach
    void setUp() {
        mockJob = new JobDTO();
        mockJob.setId(100L);
        mockJob.setTitre("Java Developer");
    }

    @Test
    void createApplication_ShouldReturnSavedApplication() {
        // Given
        Long jobId = 100L;
        Long teacherId = 1L;
        String teacherName = "Test User";
        MultipartFile mockFile = mock(MultipartFile.class);

        when(jobClient.getJobById(jobId)).thenReturn(mockJob);
        when(applicationRepository.findByJobIdAndTeacherId(jobId, teacherId)).thenReturn(Optional.empty());
        when(fileStorageService.storeFile(any(), any())).thenReturn("path/to/cv.pdf");
        when(cvTextExtractionService.extractText(any())).thenReturn("Some CV text");
        when(matchScoreService.computeMatchScore(any(), any())).thenReturn(85);
        
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
            Application app = invocation.getArgument(0);
            app.setId(1L);
            return app;
        });

        // When
        ApplicationDTO result = applicationService.createApplication(jobId, teacherId, teacherName, "Motivation", mockFile, null);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(85, result.getMatchScore());
        verify(applicationRepository, times(1)).save(any(Application.class));
    }

    @Test
    void createApplication_AlreadyExists_ShouldThrowException() {
        // Given
        Long jobId = 100L;
        Long teacherId = 1L;
        when(applicationRepository.findByJobIdAndTeacherId(jobId, teacherId)).thenReturn(Optional.of(new Application()));

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            applicationService.createApplication(jobId, teacherId, "Name", "Motivation", null, null);
        });
    }
}
