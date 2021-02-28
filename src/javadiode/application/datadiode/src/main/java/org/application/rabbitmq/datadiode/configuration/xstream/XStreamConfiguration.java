package org.application.rabbitmq.datadiode.configuration.xstream;

import com.thoughtworks.xstream.XStream;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Created by marcelmaatkamp on 26/10/15.
 */

@Configuration
public class XStreamConfiguration {
    @Bean
    XStream xstream() {
        XStream xStream = new XStream(); // JsonXStream.getInstance();
        return xStream;
    }
}
