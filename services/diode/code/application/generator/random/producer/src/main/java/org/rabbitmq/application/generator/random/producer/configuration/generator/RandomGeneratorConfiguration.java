package org.rabbitmq.application.generator.random.producer.configuration.generator;

import org.rabbitmq.application.generator.random.producer.service.RandomGeneratorService;
import org.rabbitmq.application.generator.random.producer.service.RandomGeneratorServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;

/**
 * Created by marcel on 08-12-15.
 */
@Configuration
@EnableConfigurationProperties(RandomGeneratorConfiguration.RandomGeneratorConfigurationProperties.class)
public class RandomGeneratorConfiguration {

    @Autowired
    RandomGeneratorConfigurationProperties randomGeneratorConfigurationProperties;

    @Bean
    RandomGeneratorService randomGeneratorService() {
        RandomGeneratorService randomGeneratorService = new RandomGeneratorServiceImpl();
        randomGeneratorService.setExchangeName(randomGeneratorConfigurationProperties.getExchangeName());
        randomGeneratorService.setSize(randomGeneratorConfigurationProperties.getSize());
        randomGeneratorService.setCount(randomGeneratorConfigurationProperties.getCount());
        return randomGeneratorService;
    }

    @PostConstruct
    void init() {
        randomGeneratorService().generateRandomMessages();
    }

    @ConfigurationProperties(prefix = "application.rabbitmq.generator.random")
    public static class RandomGeneratorConfigurationProperties {

        String exchangeName;
        String exchangeType;
        int size;
        int count;

        public String getExchangeName() {
            return exchangeName;
        }

        public void setExchangeName(String exchangeName) {
            this.exchangeName = exchangeName;
        }

        public String getExchangeType() {
            return exchangeType;
        }

        public void setExchangeType(String exchangeType) {
            this.exchangeType = exchangeType;
        }

        public int getSize() {
            return size;
        }

        public void setSize(int size) {
            this.size = size;
        }

        public int getCount() {
            return count;
        }

        public void setCount(int count) {
            this.count = count;
        }
    }


}
