package org.application.rabbitmq.datadiode.configuration.gson;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.application.rabbitmq.datadiode.configuration.gson.adapters.ByteArrayToBase64TypeAdapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Created by marcelmaatkamp on 01/12/15.
 */
@Configuration
public class GsonConfiguration {

    @Bean
    ByteArrayToBase64TypeAdapter byteArrayToBase64TypeAdapter() {
        ByteArrayToBase64TypeAdapter byteArrayToBase64TypeAdapter = new ByteArrayToBase64TypeAdapter();
        return byteArrayToBase64TypeAdapter;
    }

    @Bean
    Gson gson() {
        Gson gson = new GsonBuilder().registerTypeHierarchyAdapter(byte[].class,
                byteArrayToBase64TypeAdapter()).create();
        return gson;
    }
}
