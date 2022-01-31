package org.application.rabbitmq.datadiode.udp.internal;

import org.application.rabbitmq.datadiode.udp.internal.service.UdpReceiverService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

@SpringBootApplication
// @EnableIntegration
// @ImportResource("integration.xml")
public class UdpInternalStarter {
    private static final Logger log = LoggerFactory.getLogger(UdpInternalStarter.class);

    public static void main(String[] args) throws IOException, TimeoutException {
        ConfigurableApplicationContext configurableApplicationContext = new SpringApplicationBuilder(UdpInternalStarter.class).web(false).run(args);
        configurableApplicationContext.start();

        UdpReceiverService udpReceiverService = (UdpReceiverService) configurableApplicationContext.getBean("udpReceiverService");
        udpReceiverService.start();
    }
}
