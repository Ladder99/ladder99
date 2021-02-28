package org.application.rabbitmq.datadiode.cutter.model;

import com.google.common.primitives.Ints;
import com.google.common.primitives.Longs;
import com.thoughtworks.xstream.annotations.XStreamAlias;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.Serializable;
import java.util.Date;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import static org.application.rabbitmq.datadiode.cutter.model.SegmentType.SEGMENT_HEADER;

/**
 * Created by marcelmaatkamp on 24/11/15.
 */
@XStreamAlias("segmentHeader")
public class SegmentHeader implements Serializable {

    static final int LONG_SIZE = 8;
    static final int INT_SIZE = 4;
    private static final Logger log = LoggerFactory.getLogger(SegmentHeader.class);
    private static final byte DIGEST_LENGTH = 32;
    public UUID uuid = UUID.randomUUID();
    public int size;
    public int blockSize;
    public int count;
    public Date insert = new Date();
    public Date update = new Date();
    public byte[] digest;
    public boolean sent = false;

    public Set<Segment> segments = new TreeSet();

    public static SegmentHeader fromByteArray(byte[] segmentHeaderData, boolean doDigest) throws IOException, ClassNotFoundException {
        SegmentHeader segmentHeader = null;

        ByteArrayInputStream bis = new ByteArrayInputStream(segmentHeaderData);


        byte type = (byte) bis.read();
        if (type == SEGMENT_HEADER.getType()) {
            segmentHeader = fromByteArray(bis, segmentHeaderData, doDigest);
        } else {
            log.warn("this is not a segment header, type(" + type + ") unknown!");
        }

        bis.close();

        return segmentHeader;
    }

    public static SegmentHeader fromByteArray(ByteArrayInputStream bis, byte[] segmentHeaderData, boolean doDigest) throws IOException, ClassNotFoundException {
        SegmentHeader segmentHeader = new SegmentHeader();
        byte[] longByteArray = new byte[LONG_SIZE];
        byte[] intByteArray = new byte[INT_SIZE];

        bis.read(longByteArray);
        long most = Longs.fromByteArray(longByteArray);

        bis.read(longByteArray);
        segmentHeader.uuid(new UUID(most, Longs.fromByteArray(longByteArray)));

        bis.read(intByteArray);
        segmentHeader.size(Ints.fromByteArray(intByteArray));
        bis.read(intByteArray);
        segmentHeader.blockSize(Ints.fromByteArray(intByteArray));
        bis.read(intByteArray);
        segmentHeader.count(Ints.fromByteArray(intByteArray));
        bis.read(longByteArray);
        segmentHeader.insert(new Date(Longs.fromByteArray(longByteArray)));

        if (doDigest) {
            bis.read(intByteArray);
            segmentHeader.digest(new byte[Ints.fromByteArray(intByteArray)]);
            bis.read(segmentHeader.digest);
        }

        return segmentHeader;
    }

    public boolean isSent() {
        return sent;
    }

    public SegmentHeader setSent(boolean sent) {
        this.sent = sent;
        return this;
    }

    public SegmentHeader size(final int size) {
        this.size = size;
        return this;
    }

    public SegmentHeader blockSize(final int blockSize) {
        this.blockSize = blockSize;
        return this;
    }

    public SegmentHeader count(int count) {
        this.count = count;
        return this;
    }

    public SegmentHeader digest(byte[] digest) {
        this.digest = digest;
        return this;
    }

    public SegmentHeader uuid(final UUID uuid) {
        this.uuid = uuid;
        return this;
    }

    public SegmentHeader insert(final Date insert) {
        this.insert = insert;
        return this;
    }

    public Set<Segment> segments() {
        return this.segments;
    }

    public SegmentHeader addSegment(Segment segment) {
        this.segments.add(segment);
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        SegmentHeader that = (SegmentHeader) o;
        return uuid.equals(that.uuid);
    }

    /**
     * Gegerate a bytestream containing a SegmentHeader.
     *
     * @param doDigest indicates if digest should be calculated
     * @return
     */
    public byte[] toByteArray(boolean doDigest) throws IOException {

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.write(SEGMENT_HEADER.getType());
        bos.write(Longs.toByteArray(uuid.getMostSignificantBits()));
        bos.write(Longs.toByteArray(uuid.getLeastSignificantBits()));
        bos.write(Ints.toByteArray(size));

        bos.write(Ints.toByteArray(blockSize));
        bos.write(Ints.toByteArray(count));
        bos.write(Longs.toByteArray(insert.getTime()));
        if (doDigest) {
            bos.write(Ints.toByteArray(digest.length));
            bos.write(digest);
        }
        bos.close();
        return bos.toByteArray();
    }
}

