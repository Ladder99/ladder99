package org.application.rabbitmq.datadiode.encryption.decrypt.listener;

import com.rabbitmq.client.Channel;
import com.thoughtworks.xstream.XStream;
import org.bouncycastle.crypto.Digest;
import org.library.encryption.model.SecureMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.ChannelAwareMessageListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.SerializationUtils;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import java.security.KeyPair;
import java.security.PublicKey;
import java.security.Signature;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */
@Component
public class EncryptedMessageListener implements ChannelAwareMessageListener {
    private static final Logger log = LoggerFactory.getLogger(EncryptedMessageListener.class);

    @Autowired
    RabbitTemplate rabbitTemplate;

    @Autowired
    PublicKey sensorPublicKey;

    @Autowired
    Cipher cipher;

    @Autowired
    KeyGenerator keyGeneratorSymmetricalKey;

    @Autowired
    Cipher cipherSymmetricalKey;

    @Autowired
    Signature signature;

    @Autowired
    Digest digest;

    @Autowired
    KeyPair keyPair;

    int index = -1;

    @Autowired
    XStream xStream;

    @Override
    public void onMessage(Message message, Channel channel) throws Exception {
        MessageProperties messageProperties = message.getMessageProperties();
        String routingKey = messageProperties.getReceivedRoutingKey();
        Object msg = rabbitTemplate.getMessageConverter().fromMessage(message);

        if (msg instanceof SecureMessage) {

            SecureMessage secureMessage = (SecureMessage) msg;

            SecretKey decryptedKey = null;

            // decrypt symmerical key
            synchronized (cipher) {
                cipher.init(Cipher.UNWRAP_MODE, keyPair.getPrivate());
                decryptedKey = (SecretKey) cipher.unwrap(
                        secureMessage.getEncryptedKey(), "AES", Cipher.SECRET_KEY);
            }
            IvParameterSpec ivParameterSpecServer = new IvParameterSpec(secureMessage.getIv());
            byte[] decyptedData = null;

            // decrypt data
            synchronized (cipherSymmetricalKey) {
                cipherSymmetricalKey.init(Cipher.DECRYPT_MODE, decryptedKey, ivParameterSpecServer);
                decyptedData = cipherSymmetricalKey.doFinal(secureMessage.getEncryptedData());
            }

            // calculate digest
            synchronized (digest) {
                byte[] digestServer = new byte[digest.getDigestSize()];
                digest.update(secureMessage.getEncryptedData(), 0, secureMessage.getEncryptedData().length);
                digest.doFinal(digestServer, 0);

                synchronized (signature) {
                    // verify signature from digest
                    signature.initVerify(sensorPublicKey);
                    signature.update(digestServer);
                    // validate decrypted text
                    if (signature.verify(secureMessage.getSignature())) {

                        // detect missing packets
                        if (index != -1) {
                            if ((index + 1) != secureMessage.getIndex()) {
                                log.error("[" + secureMessage.getIndex() + "]: !!! MISSING SENSOR EVENT !!!");
                            }
                            index = secureMessage.getIndex();
                        } else {
                            index = secureMessage.getIndex();
                        }

                        Message decryptedMessage = (Message) SerializationUtils.deserialize(decyptedData);

                        // ExchangeMessage exchangeMessage = (ExchangeMessage) SerializationUtils.deserialize(decyptedData);

                        if (log.isDebugEnabled()) {
                            log.debug("[" + routingKey + "]: secure(" + xStream.toXML(secureMessage) + ") -> exchange(" + xStream.toXML(decryptedMessage) + ")");
                        }

                        rabbitTemplate.send(decryptedMessage);
                        // rabbitMQService.sendExchangeMessage(exchangeMessage);

                    } else {
                        log.error("did not verify!");
                    }
                }
            }
        } else if (msg instanceof byte[]) {
            log.info("not decoded: " + new String((byte[]) msg));
        } else {
        }

    }
}
