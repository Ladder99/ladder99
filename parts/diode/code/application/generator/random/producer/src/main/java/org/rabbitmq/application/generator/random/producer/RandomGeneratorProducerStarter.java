package org.rabbitmq.application.generator.random.producer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.IOException;

@SpringBootApplication
public class RandomGeneratorProducerStarter {
    private static final Logger log = LoggerFactory.getLogger(RandomGeneratorProducerStarter.class);


    public static void main(String[] args) throws IOException {
        ConfigurableApplicationContext configurableApplicationContext = new SpringApplicationBuilder(RandomGeneratorProducerStarter.class).web(false).run(args);
        configurableApplicationContext.close();
    }
}
