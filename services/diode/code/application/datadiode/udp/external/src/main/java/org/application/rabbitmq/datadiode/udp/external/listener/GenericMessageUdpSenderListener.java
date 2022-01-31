package org.application.rabbitmq.datadiode.udp.external.listener;

import com.google.common.util.concurrent.RateLimiter;
import com.rabbitmq.client.Channel;
import com.thoughtworks.xstream.XStream;
import org.compression.CompressionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.ChannelAwareMessageListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.net.*;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */

public class GenericMessageUdpSenderListener implements ChannelAwareMessageListener {
    private static final Logger log = LoggerFactory.getLogger(GenericMessageUdpSenderListener.class);

    String hostname = "192.168.1.2";
    int port = 9999;
    int packetSize = 8192;
    int packetRate = 14500;
    RateLimiter rateLimiter;
    @Autowired
    RabbitTemplate rabbitTemplate;
    @Autowired
    XStream xStream;

    // @Autowired
    // UnicastSendingMessageHandler unicastSendingMessageHandler;
    boolean compress;

    @Value(value = "${application.datadiode.udp.external.rate}")
    double rate;
    private InetAddress server;
    private DatagramSocket socket;

    public GenericMessageUdpSenderListener(int port, int packetSize, int packetRate, boolean compress) throws UnknownHostException, SocketException, IOException {
        this.port = port;
        this.packetSize = packetSize;
        this.compress = compress;
        server = InetAddress.getByName(hostname);
        this.socket = new DatagramSocket();
        // this.socket.setBroadcast(true);
        this.socket.connect(server, port);
        rateLimiter = RateLimiter.create(packetRate);

        log.info("sending packets to " + hostname + ":" + port);
    }

    public boolean isCompress() {
        return compress;
    }

    public void setCompress(boolean compress) {
        this.compress = compress;
    }

    /**
     * @param message
     * @param channel
     * @throws Exception
     */
    @Override
    public void onMessage(Message message, Channel channel) throws Exception {
        byte[] data = message.getBody();
        if (compress) {
            data = CompressionUtils.compress(data);
            if (log.isDebugEnabled()) {
                log.debug("udp: exchange(" + message.getMessageProperties().getReceivedExchange() + "): body(" + message.getBody().length + "),  compressed(" + data.length + "), ratio(" + Math.round((100.0 / data.length) * message.getBody().length) + "%)");
            }
        }

        try {
            DatagramPacket output = new DatagramPacket(data, data.length, server, port);
            socket.send(output);
            rateLimiter.acquire();
        } catch (Exception ex) {
            log.error("Exception: ", ex);
        }
    }
}
