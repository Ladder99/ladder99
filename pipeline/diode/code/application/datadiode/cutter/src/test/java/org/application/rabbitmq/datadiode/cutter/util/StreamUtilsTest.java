package org.application.rabbitmq.datadiode.cutter.util;

import org.apache.commons.lang3.RandomUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.application.rabbitmq.datadiode.cutter.model.Segment;
import org.application.rabbitmq.datadiode.cutter.model.SegmentHeader;
import org.application.rabbitmq.datadiode.model.message.ExchangeMessage;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;

import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by marcel on 04-12-15.
 */
public class StreamUtilsTest {
    private static final Logger log = LoggerFactory.getLogger(StreamUtilsTest.class);


    @Test
    public void testCut() throws Exception {
        Map<SegmentHeader, TreeSet<Segment>> uMessages = new ConcurrentHashMap();

        boolean calculateDigest = true;
        byte[] array = RandomUtils.nextBytes(65535);

        String digestName = "SHA-256";

        MessageProperties mp = new MessageProperties();
        Message m = new Message(array, mp);
        ExchangeMessage em = new ExchangeMessage(m, "exchange-data");
        List<Message> ms = StreamUtils.cut(em, 8730, 2, calculateDigest, digestName);

        for (Message message : ms) {
            byte[] segment_or_header = message.getBody();
            // ByteArrayInputStream bis = new ByteArrayInputStream(segment_or_header);
            ByteBuffer b = ByteBuffer.wrap(segment_or_header);
            byte type = b.get();
            Segment segment = Segment.fromByteArray(b, segment_or_header);
            for (SegmentHeader segmentHeader : uMessages.keySet()) {
                if (segmentHeader.uuid.equals(segment.uuid)) {

                    if (log.isDebugEnabled()) {
                        log.debug("sh[" + segmentHeader.uuid.toString() + "]: ss[" + segment.uuid.toString() + "] index[" + segment.index + "]: count: " + uMessages.get(segmentHeader).size());
                    }
                    segmentHeader.update = new Date();
                    Set<Segment> messages = uMessages.get(segmentHeader);
                    if (segment != null && messages != null) {
                        messages.add(segment);
                        if (messages.size() == segmentHeader.count) {
                            ExchangeMessage messageFromStream = StreamUtils.reconstruct(messages, calculateDigest, digestName);
                            log.info(ReflectionToStringBuilder.toString(messageFromStream));
                        }
                    }
                }
            }

        }
    }


    @Test
    public void testMulti() throws Exception {
        int arraySize = 1024;
        int size =2;

        List<byte[]> arrays = new ArrayList<>(size);
        for(int i = 0; i < size; i++) {
            arrays.add(RandomUtils.nextBytes(arraySize));
        }

        byte[] multi = StreamUtils.toMulti(arrays);
        List<byte[]> arrayFromMulti = StreamUtils.fromMulti(multi);

        Assert.assertEquals(arrayFromMulti.size(), arrays.size());

        for(int i = 0; i < size; i++) {
            Assert.assertArrayEquals(arrays.get(i), arrayFromMulti.get(i));
        }


    }
}
