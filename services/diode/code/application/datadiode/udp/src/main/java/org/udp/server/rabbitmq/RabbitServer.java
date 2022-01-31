package org.udp.server.rabbitmq;


import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.*;
import java.nio.channels.DatagramChannel;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;


/**
 * Created by marcel on 06-12-15.
 */

public class RabbitServer {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(RabbitServer.class);

    public static void main(String[] args) throws Exception {
        RabbitServer rabbitServer = new RabbitServer();
    }

    public RabbitServer() throws IOException, TimeoutException {
        LinkedBlockingQueue<byte[]> linkedBlockingQueue = new LinkedBlockingQueue();
        AtomicInteger atomicInteger = new AtomicInteger(0);

        new Thread(new Publisher(linkedBlockingQueue)).start();
        new Thread(new Consumer(linkedBlockingQueue, atomicInteger)).start();
        new Thread(new FastRabbitServerOld.StatsThread(atomicInteger)).start();
    }

    static class Consumer implements Runnable {
        private static final org.slf4j.Logger log = LoggerFactory.getLogger(Consumer.class);

        static int serverPort = 9999;
        static int packetSize = 8192;

        static byte[] b = new byte[packetSize];
        static byte[] indexBytes = new byte[4];
        static int oldIndex = -1;

        DatagramSocket socket;
        byte[] message = new byte[packetSize];
        AtomicInteger atomicInteger;

        LinkedBlockingQueue<byte[]> linkedBlockingQueue;

        public Consumer(LinkedBlockingQueue<byte[]> linkedBlockingQueue, AtomicInteger atomicInteger) throws IOException {
            this.linkedBlockingQueue = linkedBlockingQueue;
            this.atomicInteger = atomicInteger;

            DatagramChannel datagramChannel = DatagramChannel.open();
            socket = datagramChannel.socket();
            socket.setReceiveBufferSize(8192 * 128); // THIS!
            SocketAddress address = new InetSocketAddress(serverPort);
            socket.bind(address);
        }

        public void run() {
            try {
                while (true) {
                    DatagramPacket packet = new DatagramPacket(message, message.length);
                    socket.receive(packet);
                    atomicInteger.incrementAndGet();
                    byte[] m = Arrays.copyOfRange(packet.getData(), 0, packet.getLength());
                    linkedBlockingQueue.put(m);
                }
            } catch (Throwable e) {
                System.out.print(e);
            }
        }
    }


    static class Publisher implements Runnable {
        private static final org.slf4j.Logger log = LoggerFactory.getLogger(Publisher.class);

        ConnectionFactory factory;
        Connection conn;
        Channel channel;

        LinkedBlockingQueue<byte[]> linkedBlockingQueue;
        List<byte[]> msgs = new ArrayList();

        public Publisher(LinkedBlockingQueue<byte[]> linkedBlockingQueue) throws IOException, TimeoutException {
            this.linkedBlockingQueue = linkedBlockingQueue;
            ConnectionFactory factory = new ConnectionFactory();

            factory.setHost("localhost");
            factory.setUsername("guest");
            factory.setPassword("guest");
            factory.setPort(5674);

            conn = factory.newConnection();
            channel = conn.createChannel();
        }

        public void run() {
            try {
                msgs.add(linkedBlockingQueue.take());
                int count = linkedBlockingQueue.drainTo(msgs);
                for (byte[] msg : msgs) {
                    this.channel.basicPublish("udp", "", null, msg);
                }
                msgs.clear();
            } catch (Throwable e) {
                System.out.print(e);
            }
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
