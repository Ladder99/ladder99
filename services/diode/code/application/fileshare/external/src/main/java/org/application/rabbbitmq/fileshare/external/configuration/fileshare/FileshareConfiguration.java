package org.application.rabbbitmq.fileshare.external.configuration.fileshare;

import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.core.Pollers;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.io.File;
import java.util.Date;

/**
 * Created by marcelmaatkamp on 30/11/15.
 */
@Configuration
// @EnableConfigurationProperties(GenericDiskProducerConfiguration.GenericDiskProducerConfigurationProperties.class)
@EnableScheduling
// @EnableBatchProcessing
public class FileshareConfiguration {

    static int counter = 0;
    static int total = 0;
    private final Logger log = LoggerFactory.getLogger(this.getClass());
/**

    @Autowired
    GenericDiskProducerConfigurationProperties genericDiskProducerConfigurationProperties;

    @Autowired

    private String ROUTING_KEY;

    @Bean
    RegexPatternFileListFilter regexPatternFileListFilter() {
        //TODO filematching pattern to configuration properties
        RegexPatternFileListFilter regexPatternFileListFilter = new RegexPatternFileListFilter("^*.\\.xml$");
        return regexPatternFileListFilter;
    }

    RecursiveLeafOnlyDirectoryScanner recursiveLeafOnlyDirectoryScanner() {
        RecursiveLeafOnlyDirectoryScanner directoryScanner = new RecursiveLeafOnlyDirectoryScanner();
        return directoryScanner;
    }

    @Bean
    FileReadingMessageSourceFactoryBean fileReadingMessageSourceFactoryBean() throws Exception {
        FileReadingMessageSourceFactoryBean fileReadingMessageSourceFactoryBean = new FileReadingMessageSourceFactoryBean();
        fileReadingMessageSourceFactoryBean.setDirectory(new File(genericDiskProducerConfigurationProperties.getFolder()));
        log.info("Polling path: " + genericDiskProducerConfigurationProperties.getFolder());
        fileReadingMessageSourceFactoryBean.setScanEachPoll(genericDiskProducerConfigurationProperties.isScanEachPoll());
        fileReadingMessageSourceFactoryBean.setAutoCreateDirectory(genericDiskProducerConfigurationProperties.isAutoCreateDirectory());
        fileReadingMessageSourceFactoryBean.setScanner(recursiveLeafOnlyDirectoryScanner());
        fileReadingMessageSourceFactoryBean.setQueueSize(genericDiskProducerConfigurationProperties.getQueueSize());
        return fileReadingMessageSourceFactoryBean;
    }


    MessageHandler messageHandler() {
        MessageHandler messageHandler = new MessageHandler() {
            @Override
            public void handleMessage(org.springframework.messaging.Message<?> message) throws MessagingException {

                File file = (File) message.getPayload();

                if (file.lastModified() < new Date().getTime() - genericDiskProducerConfigurationProperties.getWaitForFileToBeOlderThanMs()) {

                } else {
                    try {
                        Thread.sleep(genericDiskProducerConfigurationProperties.getWaitForFileToBeOlderThanMs());
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
                if (log.isDebugEnabled()) {
                    log.debug("handleMessage: " + message.getHeaders() + ", path (" + file + ")");
                }
                if (file.isDirectory()) {
                    if (log.isDebugEnabled()) {
                        log.debug("handleMessage: " + message.getHeaders() + ", dir(" + file + ")");
                    }
                } else {
                    try {
                        byte[] body = FileUtils.readFileToByteArray(file);


                        MessageProperties properties = new MessageProperties();
                        properties.setHeader("raptor.id", message.getHeaders().get("id"));
                        properties.setHeader("raptor.file.timestamp", message.getHeaders().get("timestamp"));
                        properties.setHeader("raptor.file.name", file.getName());
                        properties.setHeader("raptor.file.path", file.getPath());

                        properties.setHeader("raptor.type", "producer");
                        properties.setHeader("raptor.insertDate", new Date());
                        properties.setHeader("raptor.producer.type", "generic/disk");

                        if (genericDiskProducerConfigurationProperties.isConvert()) {
                            MediaType mediaType = tikaService.detect(body);
                            properties.setHeader("raptor.producer.mimetype", mediaType.toString());

                            if (genericDiskProducerConfigurationProperties.isConvertXmlToJson() && "application/xml".equals(mediaType.toString())) {
                                String xml = new String(body);
                                com.gemstone.org.json.JSONObject xmlJSONObj = XML.toJSONObject(xml);
                                byte[] result = xmlJSONObj.toString().getBytes();
                                Message message1 = new Message(result, properties);
                                rabbitMQService.getAmqpTemplate().send(genericDiskProducerConfigurationProperties.getExchange().getValue(), genericDiskProducerConfigurationProperties.getRoutingkey(), message1);
                            }
                        } else {
                            Message message1 = new Message(body, properties);
                            rabbitMQService.getAmqpTemplate().send(genericDiskProducerConfigurationProperties.getExchange().getValue(), genericDiskProducerConfigurationProperties.getRoutingkey(), message1);
                        }

                        counter++;
                    } catch (Exception e) {
                        log.error("Exception while sending to RMQ " + file.getPath() + " : ", e);
                    }

                    log.debug("Deleting: " + file.getPath());
                    try {
                        log.debug("CanWrite= " + file.canWrite());
                        log.debug("isFile= " + file.isFile());
                        boolean isDeleted;
                        isDeleted = file.delete();
                        log.debug("isDeleted= " + isDeleted);
                    } catch (Exception ex) {
                        log.error("Excetpion while deleting: " + file.getPath() + " : ", ex);
                    }

                }
            }
        };
        return messageHandler;
    }

    @Bean
    public DirectChannel inputChannel() {
        return new DirectChannel();
    }

    @Bean
    public IntegrationFlow myFlow() throws Exception {
        IntegrationFlow integrationFlow = from(fileReadingMessageSourceFactoryBean().getObject(), c ->
                c.poller(Pollers.fixedRate(genericDiskProducerConfigurationProperties.getPollerRate())))
                .handle(messageHandler())
                .get();
        return integrationFlow;
    }


    @Scheduled(fixedDelayString = "5000")
    void printCounter() {
        total = total + counter;
        log.debug("total: " + total + ", " + (counter / 5) + "/sec");
        counter = 0;
    }

    @ConfigurationProperties(prefix = "raptor.disk")
    public static class GenericDiskProducerConfigurationProperties {
        Exchange exchange;
        String folder;
        boolean scanEachPoll;
        boolean autoCreateDirectory;
        int pollerRate;
        int queueSize;
        boolean convert;
        boolean convertXmlToJson;
        boolean calculateHash;
        String algorithm;
        int waitForFileToBeOlderThanMs = 1000;
        String routingkey;

        public String getRoutingkey() {
            return routingkey;
        }

        public void setRoutingkey(String routingkey) {
            this.routingkey = routingkey;
        }

        public boolean isConvert() {
            return convert;
        }

        public void setConvert(boolean convert) {
            this.convert = convert;
        }

        public boolean isConvertXmlToJson() {
            return convertXmlToJson;
        }

        public void setConvertXmlToJson(boolean convertXmlToJson) {
            this.convertXmlToJson = convertXmlToJson;
        }

        public boolean isCalculateHash() {

            return calculateHash;
        }

        public void setCalculateHash(boolean calculateHash) {
            this.calculateHash = calculateHash;
        }

        public String getAlgorithm() {
            return algorithm;
        }

        public void setAlgorithm(String algorithm) {
            this.algorithm = algorithm;
        }

        public int getWaitForFileToBeOlderThanMs() {
            return waitForFileToBeOlderThanMs;
        }

        public void setWaitForFileToBeOlderThanMs(int waitForFileToBeOlderThanMs) {
            this.waitForFileToBeOlderThanMs = waitForFileToBeOlderThanMs;
        }

        public Exchange getExchange() {
            return exchange;
        }

        public void setExchange(Exchange exchange) {
            this.exchange = exchange;
        }

        public String getFolder() {
            return folder;
        }

        public void setFolder(String folder) {
            this.folder = folder;
        }

        public boolean isScanEachPoll() {
            return scanEachPoll;
        }

        public void setScanEachPoll(boolean scanEachPoll) {
            scanEachPoll = scanEachPoll;
        }

        public boolean isAutoCreateDirectory() {
            return autoCreateDirectory;
        }

        public void setAutoCreateDirectory(boolean autoCreateDirectory) {
            this.autoCreateDirectory = autoCreateDirectory;
        }

        public int getPollerRate() {
            return pollerRate;
        }

        public void setPollerRate(int pollerRate) {
            this.pollerRate = pollerRate;
        }

        public int getQueueSize() {
            return queueSize;
        }

        public void setQueueSize(int queueSize) {
            this.queueSize = queueSize;
        }
    }

    */

}
