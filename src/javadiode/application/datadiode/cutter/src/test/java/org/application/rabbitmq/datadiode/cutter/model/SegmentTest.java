package org.application.rabbitmq.datadiode.cutter.model;

import com.google.common.primitives.Ints;
import com.google.common.primitives.Longs;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.lang3.RandomUtils;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.ByteBuffer;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

/**
 * Created by marcelmaatkamp on 02/12/15.
 */
public class SegmentTest {
    static final int SEGMENT_HEADER_SIZE = 29;
    private static final Logger log = LoggerFactory.getLogger(SegmentTest.class);
    int SEGMENT_09K_SIZE = 9000;
    int SEGMENT_64K_SIZE = 65535;
    int SEGMENT_MTU_SIZE = 1500;


    @Test
    public void testSegmentByteBuffer() throws IOException, NoSuchAlgorithmException, ClassNotFoundException {
        byte[] segment = RandomUtils.nextBytes(1255);
        int index = 10;
        UUID uuid = UUID.randomUUID();

        ByteBuffer bos = ByteBuffer.allocate(29 + segment.length);
        // 1 + 8 + 8 + 4 + 4 + 4 = 29 + segment.length
        bos.put(SegmentType.SEGMENT.getType());
        bos.putLong(uuid.getMostSignificantBits());
        bos.putLong(uuid.getLeastSignificantBits());
        bos.putInt(0);
        bos.putInt(index);
        bos.putInt(segment.length);
        bos.put(segment);

        byte[] result = bos.array();
        log.info("length(" + result.length + "), data: " + Hex.encodeHexString(result));

        ByteBuffer b = ByteBuffer.wrap(result);
        Assert.assertEquals(SegmentType.SEGMENT.getType(), b.get());
        Assert.assertEquals(b.getLong(), uuid.getMostSignificantBits());
        Assert.assertEquals(b.getLong(), uuid.getLeastSignificantBits());
        Assert.assertEquals(b.getInt(), 0);
        Assert.assertEquals(b.getInt(), index);
        Assert.assertEquals(b.getInt(), segment.length);
        byte[] s = new byte[segment.length];
        b.get(s);
        Assert.assertArrayEquals(segment, s);




    }


    @Test
    public void testSegmentByteArray() throws IOException, NoSuchAlgorithmException, ClassNotFoundException {
        byte[] segment = RandomUtils.nextBytes(1255);
        int index = 10;
        UUID uuid = UUID.randomUUID();

        ByteArrayOutputStream bos = new ByteArrayOutputStream();

        bos.write(SegmentType.SEGMENT.getType());
        bos.write(Longs.toByteArray(uuid.getMostSignificantBits()));
        bos.write(Longs.toByteArray(uuid.getLeastSignificantBits()));
        bos.write(Ints.toByteArray(0));
        bos.write(Ints.toByteArray(index));
        bos.write(Ints.toByteArray(segment.length));
        bos.write(segment);
        bos.flush();
        bos.close();

        byte[] result = bos.toByteArray();
        log.info("length(" + result.length + "), data: " + Hex.encodeHexString(result));

        ByteArrayInputStream bis = new ByteArrayInputStream(result);
        ObjectInputStream ois = new ObjectInputStream(new BufferedInputStream(bis));

        Assert.assertEquals(SegmentType.SEGMENT.getType(), ois.readByte());
        Assert.assertTrue(uuid.equals(new UUID(ois.readLong(), ois.readLong())));
        Assert.assertEquals(0, ois.readInt());
        Assert.assertEquals(index, ois.readInt());
        byte[] other_segment = new byte[ois.readInt()];
        Assert.assertEquals(segment.length, other_segment.length);
        ois.readFully(other_segment);
        Assert.assertArrayEquals(segment, other_segment);

        // 0:31, 1:31,
        log.info("header.size(" + (result.length - segment.length) + ")"); //  0..230: 31, 231..999: 34, 1000..1254: 36, 1255..(1500)..: 39, 2048: 41, 64k: 351 bytes header
        log.info("total.size(" + result.length + ")");

        bis.close();
        ois.close();
    }

    @Test
    public void testToAndFromByteArray() throws IOException {
        Segment segment = new Segment().uuid(UUID.randomUUID()).index(10).segment(RandomUtils.nextBytes(SEGMENT_64K_SIZE - SEGMENT_HEADER_SIZE));

        byte[] array = segment.toByteArray();
        assertEquals(SEGMENT_64K_SIZE, array.length);
        Segment other = Segment.fromByteArray(array);

        assertEquals(segment.uuid, other.uuid);
        assertEquals(segment.index, other.index);
        assertArrayEquals(segment.segment, other.segment);
    }

    @Test
    public void treeSetTest() {

        Map<SegmentHeader, TreeSet<Segment>> uMessages = new ConcurrentHashMap();


    }

}
