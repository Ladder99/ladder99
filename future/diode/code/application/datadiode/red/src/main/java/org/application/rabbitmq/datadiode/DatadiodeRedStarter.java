package org.application.rabbitmq.datadiode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

@SpringBootApplication
// @EnableIntegration
// @ImportResource("integration.xml")
public class DatadiodeRedStarter {
    private static final Logger log = LoggerFactory.getLogger(DatadiodeRedStarter.class);

    @Autowired
    public static void main(String[] args) throws IOException, InterruptedException, TimeoutException {
        ConfigurableApplicationContext configurableApplicationContext = new SpringApplicationBuilder(DatadiodeRedStarter.class).run(args);
        configurableApplicationContext.start();
        // UdpReceiverService udpReceiverService = (UdpReceiverService) configurableApplicationContext.getBean("udpReceiverService");
        // udpReceiverService.start();
    }
}
