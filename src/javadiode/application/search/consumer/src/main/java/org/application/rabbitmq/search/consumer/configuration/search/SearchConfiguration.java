package org.application.rabbitmq.search.consumer.configuration.search;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.serialization.JsonMetadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.sax.BodyContentHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.xml.sax.SAXException;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created by marcelmaatkamp on 23/11/15.
 */
@Configuration
public class SearchConfiguration {
    private static final Logger log = LoggerFactory.getLogger(SearchConfiguration.class);

    /**
     * System.getProperties().put( "proxySet", "true" );
     * System.getProperties().put( "socksProxyHost", "127.0.0.1" );
     * System.getProperties().put( "socksProxyPort", "1234" );
     */

    private final AtomicInteger counter = new AtomicInteger();

    @Autowired
    ConnectionFactory connectionFactory;

    private static void sendGET(URL url) throws IOException, TikaException, SAXException {
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("GET");
        con.setRequestProperty("User-Agent", "google");
        int responseCode = con.getResponseCode();
        log.info("GET Response Code :: " + responseCode);
        if (responseCode == HttpURLConnection.HTTP_OK) { // success

            parse(con.getInputStream());

            BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));
            String inputLine;
            StringBuffer response = new StringBuffer();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            // print result
            log.info(response.toString());
        } else {
            log.info("GET request not worked");
        }

    }

    public static String parse(InputStream stream) throws IOException, SAXException, TikaException {
        AutoDetectParser parser = new AutoDetectParser();
        BodyContentHandler handler = new BodyContentHandler(-1);
        Metadata metadata = new Metadata();
        parser.parse(stream, handler, metadata);
        StringWriter writer = new StringWriter();
        JsonMetadata.toJson(metadata, writer);
        log.info(writer.toString());

        return handler.toString();
    }

    @Bean
    Tika tika() {
        Tika tika = new Tika();
        return tika;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory myRabbitListenerContainerFactory() {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMaxConcurrentConsumers(1);
        return factory;
    }

    @RabbitListener(
            containerFactory = "myRabbitListenerContainerFactory",
            bindings = @QueueBinding(
                    value = @Queue(value = "url", durable = "true"),
                    exchange = @Exchange(value = "url"))
    )
    public void process(URL url) throws IOException, TikaException, SAXException {
        log.info("url(" + url + ")");
        sendGET(url);

    }

    @RabbitListener(
            containerFactory = "myRabbitListenerContainerFactory",
            bindings = @QueueBinding(
                    value = @Queue(value = "opencv", durable = "true"),
                    exchange = @Exchange(value = "images"))
    )
    public void processImageOpenCV(URL url) throws IOException, TikaException, SAXException {
        log.info("url(" + url + ")");
        sendGET(url);

    }
}
