package org.util.xstream.converter;

import com.thoughtworks.xstream.converters.Converter;
import com.thoughtworks.xstream.converters.MarshallingContext;
import com.thoughtworks.xstream.converters.UnmarshallingContext;
import com.thoughtworks.xstream.converters.basic.ByteConverter;
import com.thoughtworks.xstream.core.util.Base64Encoder;
import com.thoughtworks.xstream.io.HierarchicalStreamReader;
import com.thoughtworks.xstream.io.HierarchicalStreamWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/**
 * Created by marcelmaatkamp on 01/12/15.
 */

public class ByteArrayConverter implements Converter {
    private static final Base64Encoder base64 = new Base64Encoder();
    private static final ByteConverter byteConverter = new ByteConverter();

    private static final Logger log = LoggerFactory.getLogger(ByteArrayConverter.class);

    public boolean canConvert(Class type) {
        return type.isArray() && type.getComponentType().equals(byte.class);
    }

    public void marshal(Object source, HierarchicalStreamWriter writer, MarshallingContext context) {
        log.info("s0: " + toString(source));
        writer.setValue(toString(source));
    }

    public Object unmarshal(HierarchicalStreamReader reader, UnmarshallingContext context) {
        String key = reader.getNodeName();
        String data = reader.getValue();

        log.info("key(" + key + "): value(" + data + ")");

        if (!reader.hasMoreChildren()) {
            return fromString(data);
        } else {
            try {
                return unmarshalIndividualByteElements(reader, context);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

    private Object unmarshalIndividualByteElements(HierarchicalStreamReader reader, UnmarshallingContext context) throws IOException {

        boolean firstIteration = true;
        while (firstIteration || reader.hasMoreChildren()) { // hangover from previous hasMoreChildren
            reader.moveDown();
            String key = reader.getNodeName();
            String value = reader.getValue();

            if (key.equals("segment")) {

            }
            reader.moveUp();
            firstIteration = false;
        }


        return null;
    }

    public String toString(Object obj) {
        return base64.encode((byte[]) obj);
    }

    public Object fromString(String str) {
        return base64.decode(str);
    }

}
