package org.application.rabbitmq.datadiode.udp.internal.configuration.unicast;

import org.application.rabbitmq.datadiode.configuration.xstream.XStreamConfiguration;
import org.application.rabbitmq.datadiode.udp.internal.service.UdpReceiverService;
import org.application.rabbitmq.datadiode.udp.internal.service.UdpReceiverServiceImpl;
import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.JsonMessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;

import javax.annotation.PostConstruct;

/**
 * Created by marcelmaatkamp on 27/10/15.
 */
@Configuration
@Import(XStreamConfiguration.class)
public class UnicastConfiguration {
    private static final Logger log = LoggerFactory.getLogger(UnicastConfiguration.class);

    @Autowired
    Environment environment;

    @Autowired
    RabbitTemplate rabbitTemplate;


    @Bean
    public JsonMessageConverter jsonMessageConverter() {
        JsonMessageConverter jsonMessageConverter = new JsonMessageConverter();
        jsonMessageConverter.setJsonObjectMapper(objectMapper());
        jsonMessageConverter.setClassMapper(defaultClassMapper());
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

    @Bean
    public DefaultClassMapper defaultClassMapper() {
        DefaultClassMapper defaultClassMapper = new DefaultClassMapper();
        return defaultClassMapper;
    }

    @PostConstruct
    void init() {
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
    }


    @Bean
    RabbitAdmin rabbitAdmin() {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(rabbitTemplate.getConnectionFactory());
        return rabbitAdmin;
    }

    @Bean
    Exchange udpEchange() {
        Exchange exchange = new FanoutExchange(environment.getProperty("application.datadiode.udp.internal.exchange", String.class));
        rabbitAdmin().declareExchange(exchange);
        return exchange;
    }

    @Bean
    Queue udpQueue() {
        Queue queue = new Queue(environment.getProperty("application.datadiode.udp.internal.queue", String.class));
        rabbitAdmin().declareQueue(queue);
        rabbitAdmin().declareBinding(new Binding(queue.getName(), Binding.DestinationType.QUEUE, udpEchange().getName(), "", null));
        return queue;
    }

    @Bean
    UdpReceiverService udpReceiverService() {
        UdpReceiverService udpReceiverService = new UdpReceiverServiceImpl();
        udpReceiverService.setCompress(environment.getProperty("application.datadiode.udp.internal.compress", Boolean.class));
        return udpReceiverService;
    }
}
