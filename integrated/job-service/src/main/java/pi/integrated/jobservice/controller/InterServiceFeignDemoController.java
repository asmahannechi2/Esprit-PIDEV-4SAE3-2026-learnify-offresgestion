package pi.integrated.jobservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pi.integrated.jobservice.client.PreevaluationHealthFeignClient;

import java.util.Map;

/**
 * Démonstration du flux Feign sync n°2 (voir aussi {@link PreevaluationHealthFeignClient}).
 */
@RestController
@RequestMapping("/api/jobs/public")
@RequiredArgsConstructor
public class InterServiceFeignDemoController {

    private final PreevaluationHealthFeignClient preevaluationHealthFeignClient;

    @GetMapping("/preevaluation-health")
    public Map<String, Object> preevaluationHealthViaFeign() {
        return preevaluationHealthFeignClient.internalHealth();
    }
}
