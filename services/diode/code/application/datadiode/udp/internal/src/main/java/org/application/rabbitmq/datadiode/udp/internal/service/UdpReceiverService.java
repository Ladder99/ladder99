package org.application.rabbitmq.datadiode.udp.internal.service;

import java.io.IOException;
import java.util.concurrent.TimeoutException;

/**
 * Created by marcelmaatkamp on 27/10/15.
 */
public interface UdpReceiverService {

    public void start() throws IOException, TimeoutException;

    public void setCompress(boolean compress);
}
