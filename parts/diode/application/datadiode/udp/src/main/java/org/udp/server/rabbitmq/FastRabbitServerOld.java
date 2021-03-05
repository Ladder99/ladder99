package org.udp.server.rabbitmq;


import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.*;
import java.nio.channels.DatagramChannel;
import java.util.Arrays;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;


/**
 * Created by marcel on 06-12-15.
 */

public class FastRabbitServerOld {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(FastRabbitServerOld.class);

    static int serverPort = 9999;
    static int packetSize = 8192;

    static byte[] b = new byte[packetSize];
    static byte[] indexBytes = new byte[4];
    static int oldIndex = -1;

    public static void main(String[] args) throws Exception {
        FastRabbitServerOld rabbitServer = new FastRabbitServerOld();
    }

    FastRabbitServerOld() throws IOException, TimeoutException {
        DatagramChannel datagramChannel = DatagramChannel.open();
        DatagramSocket socket = datagramChannel.socket();
        socket.setReceiveBufferSize(8192 * 128); // THIS!

        SocketAddress address = new InetSocketAddress(serverPort);
        socket.bind(address);

        byte[] message = new byte[packetSize];
        AtomicInteger atomicInteger = new AtomicInteger(0);

        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setPort(5674);

        Connection  conn = factory.newConnection();
        Channel channel = conn.createChannel();

        Thread statsThread = new Thread(new StatsThread(atomicInteger));
        statsThread.start();

        log.info("receiving: " + serverPort + " " + socket);

        try {
            while (true) {
                DatagramPacket packet = new DatagramPacket(message, message.length);
                socket.receive(packet);
                atomicInteger.incrementAndGet();
                channel.basicPublish("udp", "", null, Arrays.copyOfRange(packet.getData(), 0, packet.getLength()));
            }
        } catch (Exception e) {
            log.error("Exception: ",e);
        } finally {
            log.info("received: " + atomicInteger.get());
        }
    }


    static class StatsThread implements Runnable {

        private final org.slf4j.Logger log = LoggerFactory.getLogger(StatsThread.class);

        AtomicInteger atomicInteger;
        int prev = 0;
        int total = 0;

        public StatsThread(AtomicInteger atomicInteger) throws SocketException {
            this.atomicInteger = atomicInteger;
        }

        public void run() {
            while (true) {
                int now = atomicInteger.get();
                int diff = (now - prev);

                if (diff > 0) {
                    total = total + diff;
                    log.info("packets: diff(" + diff + "), total in session(" + total + "), total(" + atomicInteger.get() + ")");
                    prev = now;
                } else if (total > 0) {
                    log.info("----------------------- ");
                    log.info("total packets received: " + total);
                    log.info("----------------------- ");
                    total = 0;
                }

                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
