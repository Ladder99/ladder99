package org.application.rabbitmq.search.producer.configuration.search;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created by marcelmaatkamp on 23/11/15.
 */
@Configuration
@EnableScheduling
public class SearchConfiguration {
    private static final Logger log = LoggerFactory.getLogger(SearchConfiguration.class);

    private final AtomicInteger counter = new AtomicInteger();

    @Autowired
    ConnectionFactory connectionFactory;

    @Autowired
    private volatile RabbitTemplate rabbitTemplate;

    @Bean
    public SimpleRabbitListenerContainerFactory myRabbitListenerContainerFactory() {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMaxConcurrentConsumers(5);
        return factory;
    }

    @Scheduled(fixedRate = 3000)
    public void sendMessage() throws MalformedURLException {
        rabbitTemplate.convertAndSend("url", null, new URL("http://www.nu.nl"));
    }
}
