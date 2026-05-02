package pi.integrated.preevaluation.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class UserProfileSyncClient {

    private static final Logger log = LoggerFactory.getLogger(UserProfileSyncClient.class);

    private final UserProfileFeignClient userProfileFeignClient;

    public UserProfileSyncClient(UserProfileFeignClient userProfileFeignClient) {
        this.userProfileFeignClient = userProfileFeignClient;
    }

    /**
     * Met à jour le champ profil côté user-service (même JWT que l’appel préévaluation).
     * Implémenté via OpenFeign (appel synchrone inter-MS).
     */
    public void syncFinalLevel(String authorizationBearer, String finalLevel) {
        if (authorizationBearer == null || authorizationBearer.isBlank() || finalLevel == null) {
            return;
        }
        try {
            String auth = authorizationBearer.startsWith("Bearer ")
                    ? authorizationBearer
                    : "Bearer " + authorizationBearer;
            userProfileFeignClient.syncPreevaluationFinalLevel(auth, Map.of("finalLevel", finalLevel));
        } catch (Exception e) {
            log.warn("Impossible de synchroniser le niveau final vers user-service: {}", e.getMessage());
        }
    }
}
