package org.compression;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

/**
 * Created by marcel on 18-11-15.
 */
public class CompressionUtils {
    private static final Logger log = LoggerFactory.getLogger(CompressionUtils.class);

    public static byte[] compress(byte[] data) throws IOException {
        Deflater deflater = new Deflater();
        deflater.setInput(data);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
        deflater.finish();
        byte[] buffer = new byte[data.length > 1024 ? 1024 : data.length];
        while (!deflater.finished()) {
            int count = deflater.deflate(buffer); // returns the generated code... index
            outputStream.write(buffer, 0, count);
        }
        outputStream.close();
        byte[] output = outputStream.toByteArray();
        if (log.isDebugEnabled()) {
            log.debug("Original: " + data.length + ", Compressed: " + output.length + " = " + (int) ((100.0 / data.length) * output.length) + "%");
        }
        return output;
    }

    public static byte[] decompress(byte[] data) throws IOException, DataFormatException {
        Inflater inflater = new Inflater();
        inflater.setInput(data);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
        byte[] buffer = new byte[data.length > 1024 ? 1024 : data.length];
        while (!inflater.finished()) {
            int count = inflater.inflate(buffer);
            outputStream.write(buffer, 0, count);
        }
        outputStream.close();
        byte[] output = outputStream.toByteArray();

        if (log.isDebugEnabled()) {
            log.debug("Original: " + data.length + ", Compressed: " + output.length + " = " + (int) ((100.0 / output.length) * data.length) + "%");
        }
        return output;
    }
}
