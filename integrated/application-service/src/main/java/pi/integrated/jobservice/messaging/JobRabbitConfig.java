package pi.integrated.jobservice.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ : écoute des événements utilisateur (flux async n°2) + publication réunion.
 */
@Configuration
@EnableRabbit
public class JobRabbitConfig {

    @Bean
    public TopicExchange learnifyTopicExchange() {
        return new TopicExchange(LearnifyMessaging.TOPIC_EXCHANGE, true, false);
    }

    @Bean
    public Queue jobUserRegisteredQueue() {
        return QueueBuilder.durable(LearnifyMessaging.QUEUE_JOB_USER_EVENTS).build();
    }

    @Bean
    public Binding bindUserRegistered(Queue jobUserRegisteredQueue, TopicExchange learnifyTopicExchange) {
        return BindingBuilder.bind(jobUserRegisteredQueue)
                .to(learnifyTopicExchange)
                .with(LearnifyMessaging.ROUTING_KEY_USER_REGISTERED);
    }
}
