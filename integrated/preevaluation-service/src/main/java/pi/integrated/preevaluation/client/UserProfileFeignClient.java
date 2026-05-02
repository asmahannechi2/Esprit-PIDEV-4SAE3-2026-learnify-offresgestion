package pi.integrated.preevaluation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

/**
 * Flux synchrone Feign n°1 : préévaluation → user-service (sync du niveau final).
 */
@FeignClient(name = "user-service", contextId = "userProfileSync")
public interface UserProfileFeignClient {

    @PutMapping("/api/users/me/preevaluation-final-level")
    void syncPreevaluationFinalLevel(@RequestHeader("Authorization") String authorization,
                                     @RequestBody Map<String, String> body);
}
