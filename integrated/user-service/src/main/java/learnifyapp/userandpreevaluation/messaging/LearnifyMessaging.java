package learnifyapp.userandpreevaluation.messaging;

/**
 * Constantes RabbitMQ — alignées avec job-service.
 */
public final class LearnifyMessaging {

    public static final String TOPIC_EXCHANGE = "learnify.topic";
    public static final String ROUTING_KEY_MEETING_SCHEDULED = "meeting.scheduled";
    public static final String ROUTING_KEY_USER_REGISTERED = "user.registered";
    public static final String QUEUE_USER_MEETING_EVENTS = "learnify.q.user.meeting.events";

    private LearnifyMessaging() {
    }
}
