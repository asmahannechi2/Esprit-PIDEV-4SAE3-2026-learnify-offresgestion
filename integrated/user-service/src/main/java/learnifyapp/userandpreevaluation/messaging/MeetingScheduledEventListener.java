package learnifyapp.userandpreevaluation.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Flux asynchrone RabbitMQ n°1 : réception des planifications de réunion (émis par job-service).
 */
@Component
public class MeetingScheduledEventListener {

    private static final Logger log = LoggerFactory.getLogger(MeetingScheduledEventListener.class);

    @RabbitListener(queues = LearnifyMessaging.QUEUE_USER_MEETING_EVENTS)
    public void onMeetingScheduled(String payload) {
        log.info("[RabbitMQ] meeting.scheduled reçu par user-service: {}", payload);
    }
}
