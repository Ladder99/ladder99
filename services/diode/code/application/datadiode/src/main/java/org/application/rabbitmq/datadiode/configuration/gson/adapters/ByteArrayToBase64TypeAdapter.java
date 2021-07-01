package org.application.rabbitmq.datadiode.configuration.gson.adapters;

import com.google.gson.*;
import org.apache.commons.codec.binary.Base64;

import java.lang.reflect.Type;

/**
 * Created by marcelmaatkamp on 01/12/15.
 */
public class ByteArrayToBase64TypeAdapter implements JsonSerializer<byte[]>, JsonDeserializer<byte[]> {
    public byte[] deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        return Base64.decodeBase64(json.getAsString());
    }

    public JsonElement serialize(byte[] src, Type typeOfSrc, JsonSerializationContext context) {
        return new JsonPrimitive(Base64.encodeBase64String(src));
    }
}
