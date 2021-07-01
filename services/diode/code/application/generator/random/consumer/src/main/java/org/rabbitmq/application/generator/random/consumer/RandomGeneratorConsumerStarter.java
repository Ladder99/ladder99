package org.rabbitmq.application.generator.random.consumer;

import org.apache.commons.lang3.RandomUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.IOException;

@SpringBootApplication
public class RandomGeneratorConsumerStarter {
    private static final Logger log = LoggerFactory.getLogger(RandomGeneratorConsumerStarter.class);

    static int SEGMENT_64K_SIZE = 64 * 1024;
    static int SEGMENT_1M_SIZE = 1024 * 1024;

    static int count = 0;
    static boolean sendTestMessages = true;

    public static void main(String[] args) throws IOException {
        ConfigurableApplicationContext configurableApplicationContext = new SpringApplicationBuilder(RandomGeneratorConsumerStarter.class).web(false).run(args);
        configurableApplicationContext.start();

        if (sendTestMessages) {
            RabbitTemplate rabbitTemplate = (RabbitTemplate) configurableApplicationContext.getBean("rabbitTemplate");
            byte[] data = RandomUtils.nextBytes(SEGMENT_1M_SIZE);

            for (int i = 0; i < count; i++) {
                rabbitTemplate.send("nodejsExchange", null, new Message(data, new MessageProperties()));
            }
        }
    }
}
