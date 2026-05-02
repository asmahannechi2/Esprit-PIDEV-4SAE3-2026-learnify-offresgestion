package learnifyapp.userandpreevaluation.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class UserRabbitConfig {

    @Bean
    public TopicExchange learnifyTopicExchange() {
        return new TopicExchange(LearnifyMessaging.TOPIC_EXCHANGE, true, false);
    }

    @Bean
    public Queue userMeetingScheduledQueue() {
        return QueueBuilder.durable(LearnifyMessaging.QUEUE_USER_MEETING_EVENTS).build();
    }

    @Bean
    public Binding bindMeetingScheduled(Queue userMeetingScheduledQueue, TopicExchange learnifyTopicExchange) {
        return BindingBuilder.bind(userMeetingScheduledQueue)
                .to(learnifyTopicExchange)
                .with(LearnifyMessaging.ROUTING_KEY_MEETING_SCHEDULED);
    }
}
