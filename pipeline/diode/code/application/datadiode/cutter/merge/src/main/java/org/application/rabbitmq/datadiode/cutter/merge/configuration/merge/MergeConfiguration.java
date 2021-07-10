package org.application.rabbitmq.datadiode.cutter.merge.configuration.merge;

import com.thoughtworks.xstream.XStream;
import org.application.rabbitmq.datadiode.cutter.model.Segment;
import org.application.rabbitmq.datadiode.cutter.model.SegmentHeader;
import org.application.rabbitmq.datadiode.cutter.model.SegmentType;
import org.application.rabbitmq.datadiode.cutter.util.StreamUtils;
import org.application.rabbitmq.datadiode.model.message.ExchangeMessage;
import org.application.rabbitmq.datadiode.service.RabbitMQService;
import org.application.rabbitmq.datadiode.service.RabbitMQServiceImpl;
import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageListener;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.JsonMessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.ByteBuffer;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by marcelmaatkamp on 24/11/15.
 */
@Configuration
@EnableScheduling
public class MergeConfiguration implements MessageListener {

    public static final String X_SHOVELLED = "x-shovelled";
    public static final String SRC_EXCHANGE = "src-exchange";
    public static final String SRC_QUEUE = "src-queue";
    private static final Logger log = LoggerFactory.getLogger(MergeConfiguration.class);

    // static Map<SegmentHeader, TreeSet<Segment>> uMessages = new ConcurrentHashMap();

    @Autowired
    XStream xStream;
    @Autowired
    Environment environment;
    @Value("${application.datadiode.cutter.digest}")
    boolean calculateDigest;
    @Value("${application.datadiode.cutter.digest.name}")
    String digestName;
    @Autowired
    ConnectionFactory connectionFactory;
    @Value(value = "${application.datadiode.cutter.merge.concurrentConsumers}")
    int concurrentConsumers;
    @Value(value = "${application.datadiode.cutter.merge.prefetchCount}")
    int prefetchCount = 1024;
    boolean parse = true;
    boolean sendToExchanges = false;
    @Autowired
    private volatile RabbitTemplate rabbitTemplate;

    @Bean
    Map<String, SegmentHeader> uMessages() {
        Map<String, SegmentHeader> uMessages = new ConcurrentHashMap();
        return uMessages;
    }

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
    StreamUtils streamUtils() {
        StreamUtils streamUtils = new StreamUtils();
        return streamUtils;
    }

    @Bean
    RabbitMQService rabbitMQService() {
        RabbitMQService rabbitMQService = new RabbitMQServiceImpl();
        return rabbitMQService;
    }

    // segments

    @Bean
    RabbitAdmin rabbitAdmin() {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(connectionFactory);
        return rabbitAdmin;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory() {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setConcurrentConsumers(concurrentConsumers);
        factory.setMaxConcurrentConsumers(concurrentConsumers);
        factory.setPrefetchCount(prefetchCount);
        //factory.setTxSize(1024);
        //factory.setAcknowledgeMode(AcknowledgeMode.NONE);
        return factory;
    }

    @Bean
    org.springframework.amqp.core.Exchange segmentHeaderExchange() {
        org.springframework.amqp.core.Exchange exchange = new TopicExchange("segmentHeader");
        rabbitAdmin().declareExchange(exchange);
        return exchange;
    }

    @Bean
    org.springframework.amqp.core.Queue segmentHeaderQueue() {
        org.springframework.amqp.core.Queue queue = new org.springframework.amqp.core.Queue("segmentHeader");
        rabbitAdmin().declareQueue(queue);
        rabbitAdmin().declareBinding(
                new Binding(
                        queue.getName(),
                        Binding.DestinationType.QUEUE,
                        segmentHeaderExchange().getName(),
                        "*", null));
        return queue;
    }

    @Bean
    org.springframework.amqp.core.Exchange segmentExchange() {
        org.springframework.amqp.core.Exchange segmentExchange = new TopicExchange("segment");
        rabbitAdmin().declareExchange(segmentExchange);
        return segmentExchange;
    }

    @Bean
    org.springframework.amqp.core.Queue segmentQueue() {
        org.springframework.amqp.core.Queue queue = new org.springframework.amqp.core.Queue("segment");
        rabbitAdmin().declareQueue(queue);
        rabbitAdmin().declareBinding(
                new Binding(
                        queue.getName(),
                        Binding.DestinationType.QUEUE,
                        segmentExchange().getName(),
                        "*", null));
        return queue;
    }

    @RabbitListener(

            bindings = @QueueBinding(
                    value = @Queue(value = "${application.datadiode.cutter.queue}", durable = "true"),
                    exchange = @Exchange(value = "${application.datadiode.cutter.exchange}", durable = "true", autoDelete = "false", type = "fanout"))
    )
    public void onMessage(Message message) {

        byte[] segment_or_header = message.getBody();

        try {
            // ByteArrayInputStream bis = new ByteArrayInputStream(segment_or_header);
            // byte type = (byte) bis.read();
            ByteBuffer b = ByteBuffer.wrap(segment_or_header);
            byte type = b.get();

            if (type == SegmentType.SEGMENT.getType()) {
                Segment segment = Segment.fromByteArray(b, segment_or_header);

                // log.info("[" + segment.uuid + "]: index(" + segment.index + ")..payload(" + segment.segment.length + ").segment("+segment.toByteArray().length+") : " + segment.getDigest()+")");

                if (sendToExchanges) {
                    rabbitTemplate.convertAndSend(segmentExchange().getName(), segment.uuid.toString(), segment);
                }
                if (parse) {

                    SegmentHeader segmentHeader;
                    if (!uMessages().containsKey(segment.uuid.toString())) {
                        segmentHeader = new SegmentHeader().uuid(segment.uuid).addSegment(segment).count(segment.count);
                        uMessages().put(segment.uuid.toString(), segmentHeader);
                        segmentHeader.update = new Date();
                    } else {
                        segmentHeader = uMessages().get(segment.uuid.toString());
                        segmentHeader.update = new Date();
                        if (!segmentHeader.isSent()) {
                            segmentHeader.addSegment(segment);
                        }
                    }

                    if (!segmentHeader.isSent() && segmentHeader.segments.size() == segment.count) {
                        ExchangeMessage messageFromStream = StreamUtils.reconstruct(segmentHeader.segments, calculateDigest, digestName);
                        if (messageFromStream != null) {
                            synchronized (segmentHeader) {
                                if (log.isDebugEnabled()) {
                                    log.debug("sh[" + segmentHeader.uuid.toString() + "]: ss[" + segment.uuid.toString() + "] index[" + segment.index + "] count(" + segmentHeader.segments.size() + "/" + segmentHeader.count + ") sending: " + messageFromStream.getMessage().getMessageProperties().getReceivedExchange());
                                }
                                rabbitMQService().sendExchangeMessage(messageFromStream);
                                // uMessages().remove(segmentHeader);
                            }
                        }
                        segmentHeader.setSent(true);
                        segmentHeader.segments = null;

                    }
                }
            } else {
                // log.error("Unknown type("+type+"), not a segmentHeader or segment");
            }

            // bis.close();

        } catch (IOException e) {
            log.error("Exception: ", e);
        } catch (NoSuchAlgorithmException e) {
            log.error("Exception: ", e);
        }
    }

    /**
     * Cleaup function
     *
     * @throws MalformedURLException
     */
    @Scheduled(fixedRate = 5000)
    public void cleanup() throws MalformedURLException {
        for (String uuid : uMessages().keySet()) {
            SegmentHeader segmentHeader = uMessages().get(uuid);
            if (segmentHeader.update != null && (new Date().getTime() - segmentHeader.update.getTime()) > 30000) {
                if (segmentHeader.isSent() != true) {
                    log.info("cleaning up [" + segmentHeader.uuid + "] got(" + segmentHeader.segments.size() + "), missing(" + (segmentHeader.count - segmentHeader.segments.size()) + ")");
                }
                synchronized (uMessages()) {
                    uMessages().remove(uuid);
                }
            }
        }
    }
}
