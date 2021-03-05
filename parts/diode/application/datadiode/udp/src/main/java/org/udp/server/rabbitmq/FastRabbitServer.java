package org.udp.server.rabbitmq;


import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.*;
import java.nio.channels.DatagramChannel;
import java.util.Arrays;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;


/**
 * Created by marcel on 06-12-15.
 */

public class FastRabbitServer {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(FastRabbitServer.class);

    static int serverPort = 9999;
    static int packetSize = 8192;

    static byte[] b = new byte[packetSize];
    static byte[] indexBytes = new byte[4];
    static int oldIndex = -1;

    LinkedBlockingQueue<byte[]> linkedBlockingQueue = new LinkedBlockingQueue();

    FastRabbitServer() throws IOException, TimeoutException {
        DatagramChannel datagramChannel = DatagramChannel.open();
        DatagramSocket socket = datagramChannel.socket();
        socket.setReceiveBufferSize(8192 * 128); // THIS!

        SocketAddress address = new InetSocketAddress(serverPort);
        socket.bind(address);

        byte[] message = new byte[packetSize];
        AtomicInteger atomicInteger = new AtomicInteger(0);

        ServerThread serverThread = new ServerThread(atomicInteger);
        serverThread.start();
        log.info("receiving: " + serverPort + " " + socket);

        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setPort(5674);

        Connection conn = factory.newConnection();
        Channel channel = conn.createChannel();

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

    public static void main(String[] args) throws Exception {
        FastRabbitServer server = new FastRabbitServer();
    }


    class ServerThread extends Thread {

        private final org.slf4j.Logger log = LoggerFactory.getLogger(ServerThread.class);

        AtomicInteger atomicInteger;
        int prev = 0;
        int total = 0;

        public ServerThread(AtomicInteger atomicInteger) throws SocketException {
            this.atomicInteger = atomicInteger;
        }

        public void run() {
            while (true) {
                int now = atomicInteger.get();
                int diff = (now - prev);

                if(diff > 0) {
                    total = total + diff;
                    log.info("packets: diff(" + diff + "), total in session(" + total + "), total("+atomicInteger.get()+")");
                    prev = now;
                } else if(total > 0) {
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
