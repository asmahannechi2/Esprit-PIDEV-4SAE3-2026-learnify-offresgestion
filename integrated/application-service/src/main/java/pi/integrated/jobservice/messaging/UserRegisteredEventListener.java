package pi.integrated.jobservice.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Flux asynchrone RabbitMQ n°2 : consommation {@code user.registered} (émis par user-service).
 */
@Component
public class UserRegisteredEventListener {

    private static final Logger log = LoggerFactory.getLogger(UserRegisteredEventListener.class);

    @RabbitListener(queues = LearnifyMessaging.QUEUE_JOB_USER_EVENTS)
    public void onUserRegistered(String payload) {
        log.info("[RabbitMQ] user.registered reçu par job-service: {}", payload);
    }
}
