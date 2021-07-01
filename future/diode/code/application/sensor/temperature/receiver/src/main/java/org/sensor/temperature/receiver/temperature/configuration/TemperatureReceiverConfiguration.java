package org.sensor.temperature.receiver.temperature.configuration;

import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.event.configuration.xstream.XStreamConfiguration;
import org.sensor.temperature.receiver.temperature.listener.TemperatureSensorEventListener;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.JsonMessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import javax.annotation.PostConstruct;

/**
 * Created by marcel on 27-11-15.
 */
@Configuration
@Import(XStreamConfiguration.class)
public class TemperatureReceiverConfiguration {


    @Autowired
    RabbitTemplate rabbitTemplate;

    @Bean
    public DefaultClassMapper defaultClassMapper() {
        DefaultClassMapper defaultClassMapper = new DefaultClassMapper();
        return defaultClassMapper;
    }

    @Bean
    public JsonMessageConverter jsonMessageConverter() {
        JsonMessageConverter jsonMessageConverter = new JsonMessageConverter();
        jsonMessageConverter.setJsonObjectMapper(objectMapper());
        jsonMessageConverter.setClassMapper(defaultClassMapper());
        DefaultClassMapper defaultClassMapper = defaultClassMapper();
        return jsonMessageConverter;
    }

    @Bean
    ObjectMapper objectMapper() {
        ObjectMapper jsonObjectMapper = new ObjectMapper();
        jsonObjectMapper
                .configure(
                        DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES,
                        false);
        jsonObjectMapper.setSerializationInclusion(JsonSerialize.Inclusion.NON_NULL);
        return jsonObjectMapper;
    }

    @PostConstruct
    void init() {
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
    }

    @Bean
    RabbitAdmin rabbitAdmin() {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(rabbitTemplate.getConnectionFactory());
        rabbitAdmin.setAutoStartup(true);
        return rabbitAdmin;
    }

    @Bean
    Exchange sensorExchange() {
        Exchange exchange = new FanoutExchange("sensor");
        return exchange;
    }

    @Bean
    Queue sensorQueue() {
        Queue queue = new Queue("sensor");
        return queue;
    }

    @Bean
    BindingBuilder.GenericArgumentsConfigurer sensorQueueBinding() {
        BindingBuilder.GenericArgumentsConfigurer destinationConfigurer = BindingBuilder.bind(sensorQueue()).to(sensorExchange()).with("");
        rabbitAdmin().declareBinding(new Binding(sensorQueue().getName(), Binding.DestinationType.QUEUE, sensorExchange().getName(), "", null));
        return destinationConfigurer;
    }

    @Bean
    TemperatureSensorEventListener sensorEventListener() {
        TemperatureSensorEventListener sensorEventListenerer = new TemperatureSensorEventListener();
        return sensorEventListenerer;
    }

    @Bean
    SimpleMessageListenerContainer sensorListenerContainer() {
        SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer();
        simpleMessageListenerContainer.setConnectionFactory(rabbitTemplate.getConnectionFactory());
        MessageListenerAdapter messageListenerAdapter = new MessageListenerAdapter(sensorEventListener());
        simpleMessageListenerContainer.setQueueNames(sensorQueue().getName());
        simpleMessageListenerContainer.setMessageListener(messageListenerAdapter);
        simpleMessageListenerContainer.start();
        return simpleMessageListenerContainer;
    }
}
