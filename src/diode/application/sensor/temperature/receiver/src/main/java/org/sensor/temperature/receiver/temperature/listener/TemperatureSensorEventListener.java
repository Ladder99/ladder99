package org.sensor.temperature.receiver.temperature.listener;

import com.rabbitmq.client.Channel;
import com.thoughtworks.xstream.XStream;
import org.event.model.sensor.temperature.TemperatureSensorEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.ChannelAwareMessageListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */
public class TemperatureSensorEventListener implements ChannelAwareMessageListener {
    private static final Logger log = LoggerFactory.getLogger(TemperatureSensorEventListener.class);

    @Autowired
    RabbitTemplate rabbitTemplate;

    @Autowired
    XStream xStream;

    @Override
    public void onMessage(Message message, Channel channel) throws Exception {
        TemperatureSensorEvent temperatureSensorEvent = (TemperatureSensorEvent) rabbitTemplate.getMessageConverter().fromMessage(message);
        log.info("[" + temperatureSensorEvent.getIndex() + "]: on date(" + temperatureSensorEvent.getDate() + "), temp(" + temperatureSensorEvent.getTemperature() + "C) at " + xStream.toXML(temperatureSensorEvent.getSensor().getGeoLocation()));
    }
}
