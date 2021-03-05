package org.application.rabbitmq.datadiode.cutter.merge;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.IOException;

@SpringBootApplication
public class CutterMergeStarter {
    private static final Logger log = LoggerFactory.getLogger(CutterMergeStarter.class);

    public static void main(String[] args) throws IOException {
        ConfigurableApplicationContext configurableApplicationContext = new SpringApplicationBuilder(CutterMergeStarter.class).web(false).run(args);
    }
}
