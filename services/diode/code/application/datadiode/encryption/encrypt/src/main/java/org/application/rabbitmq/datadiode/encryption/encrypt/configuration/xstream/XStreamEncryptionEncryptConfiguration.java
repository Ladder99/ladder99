package org.application.rabbitmq.datadiode.encryption.encrypt.configuration.xstream;

import com.thoughtworks.xstream.XStream;
import org.library.encryption.model.SecureMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import javax.annotation.PostConstruct;

/**
 * Created by marcelmaatkamp on 26/10/15.
 */

@Configuration
@Import(org.application.rabbitmq.datadiode.configuration.xstream.XStreamConfiguration.class)
public class XStreamEncryptionEncryptConfiguration {

    @Autowired
    XStream xStream;

    @PostConstruct
    void init() {
        xStream.alias("secureMessage", SecureMessage.class);
    }
}
