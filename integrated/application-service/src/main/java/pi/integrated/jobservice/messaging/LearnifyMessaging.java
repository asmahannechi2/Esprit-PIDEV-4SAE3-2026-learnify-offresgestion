package pi.integrated.jobservice.messaging;

/**
 * Constantes RabbitMQ (topic) — alignées avec user-service.
 */
public final class LearnifyMessaging {

    public static final String TOPIC_EXCHANGE = "learnify.topic";
    public static final String ROUTING_KEY_MEETING_SCHEDULED = "meeting.scheduled";
    public static final String ROUTING_KEY_USER_REGISTERED = "user.registered";
    public static final String QUEUE_JOB_USER_EVENTS = "learnify.q.job.user.events";

    private LearnifyMessaging() {
    }
}
