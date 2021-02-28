package org.rabbitmq.application.generator.random.producer.configuration.rabbitmq;

import org.rabbitmq.application.generator.random.producer.configuration.generator.RandomGeneratorConfiguration;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.io.IOException;

/**
 * Created by marcel on 08-12-15.
 */
@Configuration
public class RabbitMQConfiguration {

    @Autowired
    RandomGeneratorConfiguration.RandomGeneratorConfigurationProperties randomGeneratorConfigurationProperties;

    @Autowired
    RabbitTemplate rabbitTemplate;

    @Autowired
    Environment environment;

    @Bean
    org.springframework.amqp.core.Exchange exchange() throws IOException {
        org.springframework.amqp.core.Exchange exchange = new FanoutExchange(environment.getProperty("application.rabbitmq.generator.random.exchangeName", String.class));
        rabbitAdmin().declareExchange(exchange);
        return exchange;
    }

    @Bean
    RabbitAdmin rabbitAdmin() {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(rabbitTemplate.getConnectionFactory());
        return rabbitAdmin;
    }


}
