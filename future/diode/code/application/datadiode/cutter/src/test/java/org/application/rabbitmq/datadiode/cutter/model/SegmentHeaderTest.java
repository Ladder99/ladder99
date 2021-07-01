package org.application.rabbitmq.datadiode.cutter.model;

import org.apache.commons.lang3.RandomUtils;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.MessageDigest;
import java.util.Date;
import java.util.UUID;

import static org.junit.Assert.*;

/**
 * Created by marcelmaatkamp on 02/12/15.
 */
public class SegmentHeaderTest {
    private static final Logger log = LoggerFactory.getLogger(SegmentHeaderTest.class);
    final int SEGMENT_HEADER_WITH_DIGEST_SIZE = 73;
    final int SEGMENT_HEADER_WITHOUT_DIGEST_SIZE = 37;
    int SEGMENT_09K_SIZE = 9000;
    int SEGMENT_64K_SIZE = 65535;
    int SEGMENT_MTU_SIZE = 1500;

    @Test
    public void testToAndFromByteArrayWithDigest() throws Exception {
        byte[] randomBytes = RandomUtils.nextBytes(SEGMENT_64K_SIZE);
        Date now = new Date();

        boolean calculateDigest = true;

        SegmentHeader segmentHeader = new SegmentHeader().
                uuid(UUID.randomUUID()).
                size(15).blockSize(16).count(17).insert(now);

        if (calculateDigest) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(randomBytes);
            segmentHeader.digest(md.digest());
        }

        byte[] segmentHeaderData = segmentHeader.toByteArray(calculateDigest);
        assertEquals(segmentHeaderData.length, SEGMENT_HEADER_WITH_DIGEST_SIZE);
        SegmentHeader other = SegmentHeader.fromByteArray(segmentHeaderData, calculateDigest);

        assertEquals(segmentHeader.uuid, other.uuid);
        assertEquals(segmentHeader.size, other.size);
        assertEquals(segmentHeader.blockSize, other.blockSize);
        assertEquals(segmentHeader.count, other.count);
        assertEquals(segmentHeader.insert, other.insert);
        assertArrayEquals(segmentHeader.digest, other.digest);
    }

    @Test
    public void testToAndFromByteArrayWithoutDigest() throws Exception {

        byte[] randomBytes = RandomUtils.nextBytes(SEGMENT_MTU_SIZE);
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.update(randomBytes);

        Date now = new Date();
        boolean calculateDigest = false;

        SegmentHeader segmentHeader = new SegmentHeader().
                uuid(UUID.randomUUID()).
                size(15).blockSize(16).count(17).insert(now);

        byte[] segmentHeaderData = segmentHeader.toByteArray(calculateDigest);
        assertEquals(segmentHeaderData.length, SEGMENT_HEADER_WITHOUT_DIGEST_SIZE);

        SegmentHeader other = SegmentHeader.fromByteArray(segmentHeaderData, calculateDigest);

        assertEquals(segmentHeader.uuid, other.uuid);
        assertEquals(segmentHeader.size, other.size);
        assertEquals(segmentHeader.blockSize, other.blockSize);
        assertEquals(segmentHeader.count, other.count);
        assertEquals(segmentHeader.insert, other.insert);
        assertNull(other.digest);
    }

}
