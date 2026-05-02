package pi.integrated.jobservice.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Flux asynchrone RabbitMQ n°1 : publication {@code meeting.scheduled} après planification.
 */
@Component
public class MeetingScheduledEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(MeetingScheduledEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public MeetingScheduledEventPublisher(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    public void publish(Long meetingId, Long applicationId) {
        try {
            String json = objectMapper.writeValueAsString(Map.of(
                    "event", "meeting.scheduled",
                    "meetingId", meetingId,
                    "applicationId", applicationId
            ));
            rabbitTemplate.convertAndSend(
                    LearnifyMessaging.TOPIC_EXCHANGE,
                    LearnifyMessaging.ROUTING_KEY_MEETING_SCHEDULED,
                    json
            );
        } catch (JsonProcessingException e) {
            log.warn("Sérialisation événement meeting: {}", e.getMessage());
        }
    }
}
