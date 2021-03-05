package org.application.rabbitmq.datadiode.cutter.util;

import java.io.ByteArrayOutputStream;

/**
 * Created by marcelmaatkamp on 14/12/15.
 */
public class MyByteArrayOutputStream extends ByteArrayOutputStream {
    public MyByteArrayOutputStream() {
    }

    public MyByteArrayOutputStream(int size) {
        super(size);
    }

    public int getCount() {
        return count;
    }

    public byte[] getBuf() {
        return buf;
    }
}
