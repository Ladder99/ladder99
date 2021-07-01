package org.application.rabbitmq.datadiode.cutter.configuration;

import com.thoughtworks.xstream.XStream;
import org.application.rabbitmq.datadiode.cutter.model.Segment;
import org.application.rabbitmq.datadiode.cutter.model.SegmentHeader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

/**
 * Created by marcelmaatkamp on 01/12/15.
 */
@Configuration
public class CutterConfiguration {

    @Autowired
    XStream xStream;

    @PostConstruct
    void init() {
        xStream.processAnnotations(Segment.class);
        xStream.processAnnotations(SegmentHeader.class);
    }
}
