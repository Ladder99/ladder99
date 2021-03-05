package org.application.rabbitmq.datadiode.service;

import com.thoughtworks.xstream.XStream;
import org.application.rabbitmq.datadiode.model.message.ExchangeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitManagementTemplate;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by marcelmaatkamp on 29/10/15.
 */
@Service
public class RabbitMQServiceImpl implements RabbitMQService {

    public static final String X_SHOVELLED = "x-shovelled";
    public static final String SRC_EXCHANGE = "src-exchange";
    private static final Logger log = LoggerFactory.getLogger(RabbitMQServiceImpl.class);

    @Autowired
    Environment environment;

    @Autowired
    RabbitTemplate rabbitTemplate;

    @Autowired
    XStream xStream;

    @Autowired
    RabbitAdmin rabbitAdmin;

    @Bean
    Map<String, String> declaredExchanges() {
        Map<String, String> declaredExchanges = new HashMap();
        for (Exchange exchange : rabbitManagementTemplate().getExchanges()) {
            declaredExchanges.put(exchange.getName(), xStream.toXML(exchange));
        }
        return declaredExchanges;
    }

    @Bean
    RabbitManagementTemplate rabbitManagementTemplate() {
        RabbitManagementTemplate rabbitManagementTemplate = new RabbitManagementTemplate(
                "http://" + environment.getProperty("spring.rabbitmq.management.host") + ":" + environment.getProperty("spring.rabbitmq.management.port", Integer.class) + "/api/",
                environment.getProperty("spring.rabbitmq.username"),
                environment.getProperty("spring.rabbitmq.password")
        );
        return rabbitManagementTemplate;
    }


    public ExchangeMessage getExchangeMessage(RabbitManagementTemplate rabbitManagementTemplate, Message message) {
        String exchangeName = null;

        ExchangeMessage exchangeMessage;

        if (message.getMessageProperties().getHeaders().containsKey(X_SHOVELLED)) {
            ArrayList shovelled_headers = (ArrayList) message.getMessageProperties().getHeaders().get(X_SHOVELLED);
            Map<String, Object> shovelled_headers_map = (Map) shovelled_headers.get(0);
            exchangeName = (String) shovelled_headers_map.get(SRC_EXCHANGE);

            if (log.isDebugEnabled()) {
                log.debug("shovelled from:" + exchangeName);
            }

            if (!declaredExchanges().containsKey(exchangeName)) {
                Exchange exchange = new FanoutExchange(exchangeName);
                declaredExchanges().put(exchangeName, xStream.toXML(exchange));
                exchangeCache.put(message.getMessageProperties().getReceivedExchange(), exchange);
            }

            exchangeMessage = new ExchangeMessage(message, (String) declaredExchanges().get(exchangeName));
        } else {
            exchangeName = message.getMessageProperties().getReceivedExchange();

            if (!declaredExchanges().containsKey(exchangeName)) {
                Exchange exchange = rabbitManagementTemplate.getExchange(message.getMessageProperties().getReceivedExchange());
                exchangeCache.put(message.getMessageProperties().getReceivedExchange(), exchange);
                declaredExchanges().put(exchangeName, xStream.toXML(exchange));
            }
            exchangeMessage = new ExchangeMessage(message, (String) declaredExchanges().get(exchangeName));

        }
        return exchangeMessage;
    }

    Map <String, Exchange> exchangeCache = new HashMap<>();

    public void sendExchangeMessage(ExchangeMessage exchangeMessage) {
        try {
            if (exchangeMessage.getExchangeData() != null) {
                Exchange exchange = null;

                if(exchangeCache.containsKey(exchangeMessage.getMessage().getMessageProperties().getReceivedExchange())) {
                    exchange = exchangeCache.get(exchangeMessage.getMessage().getMessageProperties().getReceivedExchange());
                } else {
                    exchange = (Exchange) xStream.fromXML(exchangeMessage.getExchangeData());
                }

                if (!declaredExchanges().keySet().contains(exchange)) {
                    rabbitAdmin.declareExchange(exchange);
                    declaredExchanges().put(exchange.getName(), exchangeMessage.getExchangeData());
                    exchangeCache.put(exchange.getName(), exchange);
                }

                if (log.isTraceEnabled()) {
                    log.trace("exchange(" + exchange.getName() + ").routing(" + exchangeMessage.getMessage().getMessageProperties().getReceivedRoutingKey() + "): body(" + xStream.toXML(exchangeMessage.getMessage()) + ")");

                } else if (log.isDebugEnabled()) {
                    log.debug("exchange(" + exchange.getName() + ").routing(" + exchangeMessage.getMessage().getMessageProperties().getReceivedRoutingKey() + "): body.length(" + exchangeMessage.getMessage().getBody().length + ")");

                }
                // log.info("to.headers: " + xStream.toXML(exchangeMessage.getMessage().getMessageProperties()));
                // into rabbitmq
                rabbitTemplate.send(
                        exchange.getName(),
                        exchangeMessage.getMessage().getMessageProperties().getReceivedRoutingKey(),
                        exchangeMessage.getMessage()
                );
            } else {
                log.error("exchangeMessage.getExchangeData() null: " + xStream.toXML(exchangeMessage));
            }
        } catch (NullPointerException e) {
            log.error("Exception: ", e);
        }
    }

}
