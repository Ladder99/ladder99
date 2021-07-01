package org.application.rabbitmq.datadiode.encryption.decrypt.configuration.decrypt;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.FileUtils;
import org.application.rabbitmq.datadiode.encryption.decrypt.listener.EncryptedMessageListener;
import org.bouncycastle.crypto.Digest;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
import java.io.File;
import java.io.IOException;
import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

/**
 * Created by marcelmaatkamp on 19/10/15.
 */

@Configuration
public class DecryptConfiguration {
    private static final Logger log = LoggerFactory.getLogger(DecryptConfiguration.class);

    String publicKeyFilename = "public.key";
    String privateKeyFilename = "private.key";

    @Autowired
    ApplicationContext applicationContext;

    // signature
    @Value("${application.datadiode.encryption.cipher.signature}")
    String ALGORITHM_SIGNATURE;

    // provider
    @Value("${application.datadiode.encryption.cipher.provider}")
    String SECURITY_PROVIDER;

    // asymmetrical cipher settings
    @Value("${application.datadiode.encryption.cipher.asymmetrical.algorithm}")
    String ALGORITHM_ASYMMETRICAL;
    @Value("${application.datadiode.encryption.cipher.asymmetrical.cipher}")
    String ALGORITHM_ASYMMETRICAL_CIPHER;
    @Value("${application.datadiode.encryption.cipher.asymmetrical.keysize}")
    int ALGORITHM_ASYMMETRICAL_KEYSIZE;

    // symmetrical cipher settings
    @Value("${application.datadiode.encryption.cipher.symmetrical.algorithm}")
    String ALGORITHM_SYMMETRICAL;
    @Value("${application.datadiode.encryption.cipher.symmetrical.cipher}")
    String ALGORITHM_SYMMETRICAL_CIPHER;
    @Value("${application.datadiode.encryption.cipher.symmetrical.keysize}")
    int ALGORITHM_SYMMETRICAL_KEYSIZE;
    @Autowired
    RabbitTemplate rabbitTemplate;

    @Bean
    KeyFactory keyFactory() throws NoSuchAlgorithmException {
        KeyFactory keyFactory = KeyFactory.getInstance(ALGORITHM_ASYMMETRICAL);
        return keyFactory;
    }

    @Bean
    KeyPairGenerator keyPairGenerator() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(ALGORITHM_ASYMMETRICAL);
        keyPairGenerator.initialize(ALGORITHM_ASYMMETRICAL_KEYSIZE);
        return keyPairGenerator;
    }

    @Bean
    Cipher cipher() throws NoSuchPaddingException, NoSuchAlgorithmException, NoSuchProviderException {
        Security.addProvider(new BouncyCastleProvider());
        Cipher cipherServer = Cipher.getInstance(ALGORITHM_ASYMMETRICAL_CIPHER, SECURITY_PROVIDER);
        return cipherServer;
    }

    @Bean
    KeyGenerator keyGeneratorSymmetricalKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGeneratorSymmetricalKeyServer = KeyGenerator.getInstance(ALGORITHM_SYMMETRICAL);
        keyGeneratorSymmetricalKeyServer.init(ALGORITHM_SYMMETRICAL_KEYSIZE);
        return keyGeneratorSymmetricalKeyServer;
    }

    @Bean
    Cipher cipherSymmetricalKey() throws NoSuchPaddingException, NoSuchAlgorithmException, NoSuchProviderException {
        Cipher cipher = Cipher.getInstance(ALGORITHM_SYMMETRICAL_CIPHER, SECURITY_PROVIDER);
        return cipher;
    }

    @Bean
    Signature signature() throws NoSuchAlgorithmException {
        Signature signature = Signature.getInstance(ALGORITHM_SIGNATURE);
        return signature;
    }

    @Bean
    Digest digest() {
        SHA256Digest sha256Digest = new SHA256Digest();
        return sha256Digest;
    }

    @Bean
    SecureRandom secureRandom() {
        SecureRandom secureRandom = new SecureRandom();
        return secureRandom;
    }

    @Bean
    KeyPair keyPair() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        Resource encodedPrivateKeyResource = applicationContext.getResource("security/" + privateKeyFilename);
        Resource encodedPublicKeyResource = applicationContext.getResource("security/" + publicKeyFilename);

        if (encodedPrivateKeyResource.exists() && encodedPublicKeyResource.exists()) {
            byte[] encodedPrivateKey = Base64.decodeBase64(FileUtils.readFileToByteArray(encodedPrivateKeyResource.getFile()));
            byte[] encodedPublicKey = Base64.decodeBase64(FileUtils.readFileToByteArray(encodedPublicKeyResource.getFile()));

            X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(encodedPublicKey);
            PublicKey publicKey = keyFactory().generatePublic(publicKeySpec);

            PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(encodedPrivateKey);
            PrivateKey privateKey = keyFactory().generatePrivate(privateKeySpec);

            return new KeyPair(publicKey, privateKey);
        } else {
            KeyPair keyPair = keyPairGenerator().generateKeyPair();

            X509EncodedKeySpec x509EncodedKeySpec = new X509EncodedKeySpec(
                    keyPair.getPublic().getEncoded());
            FileUtils.writeByteArrayToFile(
                    new File("src/main/resources/security/public.key"),
                    Base64.encodeBase64(x509EncodedKeySpec.getEncoded()));

            PKCS8EncodedKeySpec pkcs8EncodedKeySpec = new PKCS8EncodedKeySpec(
                    keyPair.getPrivate().getEncoded());
            FileUtils.writeByteArrayToFile(
                    new File("src/main/resources/security/private.key"),
                    Base64.encodeBase64(pkcs8EncodedKeySpec.getEncoded()));

            return keyPair;
        }
    }

    @Bean
    PublicKey sensorPublicKey() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
        Resource encodedPublicKeyResource = applicationContext.getResource("security/sensor/" + publicKeyFilename);
        if (encodedPublicKeyResource.exists()) {
            byte[] encodedPublicKey = Base64.decodeBase64(FileUtils.readFileToByteArray(encodedPublicKeyResource.getFile()));
            X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(encodedPublicKey);
            PublicKey publicKey = keyFactory().generatePublic(publicKeySpec);
            return publicKey;
        }
        return null;
    }

    @Bean
    RabbitAdmin rabbitAdmin() {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(rabbitTemplate.getConnectionFactory());
        return rabbitAdmin;
    }


    @Bean
    Queue encryptedQueue() {
        Queue queue = new Queue("encrypted");
        return queue;
    }

    @Bean
    Exchange encryptedExchange() {
        Exchange exchange = new FanoutExchange("encrypted");
        rabbitAdmin().declareExchange(exchange);
        rabbitAdmin().declareBinding(new Binding(encryptedQueue().getName(), Binding.DestinationType.QUEUE, exchange.getName(), "", null));
        return exchange;
    }

    @Bean
    EncryptedMessageListener encryptedEventListener() {
        EncryptedMessageListener encryptedMessageListener = new EncryptedMessageListener();
        return encryptedMessageListener;
    }

    @Bean
    SimpleMessageListenerContainer encryptedListenerContainer() {
        SimpleMessageListenerContainer simpleMessageListenerContainer = new SimpleMessageListenerContainer();
        simpleMessageListenerContainer.setConnectionFactory(rabbitTemplate.getConnectionFactory());
        simpleMessageListenerContainer.setMessageListener(encryptedEventListener());
        simpleMessageListenerContainer.setQueueNames(encryptedQueue().getName());
        simpleMessageListenerContainer.setConcurrentConsumers(1);
        simpleMessageListenerContainer.start();
        return simpleMessageListenerContainer;
    }
}
