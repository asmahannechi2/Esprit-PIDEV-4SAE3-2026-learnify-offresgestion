package learnifyapp.userandpreevaluation.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Flux asynchrone RabbitMQ n°2 : publication après inscription candidat.
 */
@Component
public class UserRegistrationEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(UserRegistrationEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public UserRegistrationEventPublisher(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    public void publish(Long userId, String email) {
        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "event", LearnifyMessaging.ROUTING_KEY_USER_REGISTERED,
                    "userId", userId,
                    "email", email
            ));
            rabbitTemplate.convertAndSend(
                    LearnifyMessaging.TOPIC_EXCHANGE,
                    LearnifyMessaging.ROUTING_KEY_USER_REGISTERED,
                    json
            );
        } catch (JsonProcessingException e) {
            log.warn("Sérialisation événement user.registered: {}", e.getMessage());
        }
    }
}
