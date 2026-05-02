package pi.integrated.jobservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

/**
 * Flux synchrone Feign n°2 : job-service → preevaluation-service (santé inter-MS).
 */
@FeignClient(name = "preevaluation-service", contextId = "preevaluationHealth")
public interface PreevaluationHealthFeignClient {

    @GetMapping("/api/preevaluation/internal/health")
    Map<String, Object> internalHealth();
}
