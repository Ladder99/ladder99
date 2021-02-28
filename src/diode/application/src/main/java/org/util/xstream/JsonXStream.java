package org.util.xstream;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.json.JettisonMappedXmlDriver;

import javax.annotation.Resource;

/**
 * Created by marcelmaatkamp on 01/12/15.
 */
@Resource
public class JsonXStream extends XStream {

    private final static JsonXStream s_instance = new JsonXStream();

    public JsonXStream() {
        super(new JettisonMappedXmlDriver());
        // registerConverter(new ByteArrayConverter());
        setMode(XStream.NO_REFERENCES);
        // processAnnotations(new Class[]{Event.class});
    }

    public static JsonXStream getInstance() {
        return s_instance;
    }
}
