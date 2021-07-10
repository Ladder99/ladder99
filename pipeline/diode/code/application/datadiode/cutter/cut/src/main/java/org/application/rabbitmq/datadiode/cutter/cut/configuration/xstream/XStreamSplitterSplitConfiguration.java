package org.application.rabbitmq.datadiode.cutter.cut.configuration.xstream;

import com.thoughtworks.xstream.XStream;
import org.application.rabbitmq.datadiode.configuration.xstream.XStreamConfiguration;
import org.application.rabbitmq.datadiode.cutter.model.Segment;
import org.application.rabbitmq.datadiode.cutter.model.SegmentHeader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import javax.annotation.PostConstruct;

/**
 * Created by marcelmaatkamp on 26/10/15.
 */

@Configuration
@Import(XStreamConfiguration.class)
public class XStreamSplitterSplitConfiguration {

    @Autowired
    XStream xStream;

    @PostConstruct
    void init() {
        xStream.processAnnotations(Segment.class);
        xStream.processAnnotations(SegmentHeader.class);
    }
}
