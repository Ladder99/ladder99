package org.rabbitmq.application.generator.random.producer.service;

/**
 * Created by marcel on 08-12-15.
 */
public interface RandomGeneratorService {

    public int getSize();

    public void setSize(int size);

    public int getCount();

    public void setCount(int count);

    public void setExchangeName(String exchangeName);

    public void generateRandomMessages();
}
