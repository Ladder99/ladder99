package org.application.rabbitmq.datadiode.encryption.encrypt.listener;

import com.rabbitmq.client.Channel;
import com.thoughtworks.xstream.XStream;
import org.bouncycastle.crypto.Digest;
import org.library.encryption.model.SecureMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.ChannelAwareMessageListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.SerializationUtils;

import javax.annotation.Resource;
import javax.crypto.*;
import javax.crypto.spec.IvParameterSpec;
import java.security.*;

/**
 * Encrypt and reemit message
 * <p>
 * Created by marcelmaatkamp on 15/10/15.
 */
@Resource
public class EncryptMessageListener implements ChannelAwareMessageListener {
    private static final Logger log = LoggerFactory.getLogger(EncryptMessageListener.class);

    @Autowired
    RabbitTemplate rabbitTemplate;
    Exchange encryptedExchange;
    @Autowired
    KeyPair keyPair;
    @Autowired
    Digest digest;
    @Autowired
    Signature signature;
    @Autowired
    SecureRandom secureRandom;
    @Autowired
    Cipher cipherSymmetricalKey;
    @Autowired
    KeyGenerator keyGeneratorSymmetricalKey;
    @Autowired
    Cipher cipher;
    @Autowired
    PublicKey serverPublicKey;
    @Autowired
    XStream xStream;

    public Exchange getEncryptedExchange() {
        return encryptedExchange;
    }

    public void setEncryptedExchange(Exchange encryptedExchange) {
        this.encryptedExchange = encryptedExchange;
    }

    /**
     * Convert message to ExchangeMessage and encrypt that into a SecureMessage with the priv/pub key and pubkey of server and
     * and send it to the encrypted-exchange.
     *
     * @param message
     * @param channel
     * @throws Exception
     */
    @Override
    public void onMessage(Message message, Channel channel) throws Exception {
        // convert to an exchange message
        // ExchangeMessage exchangeMessage = rabbitMQService.getExchangeMessage(message);

        // convert that to an secure messagae
        SecureMessage secureMessage = encryptMessage(SerializationUtils.serialize(message));
        if (log.isDebugEnabled()) {
            Object o = rabbitTemplate.getMessageConverter().fromMessage(message);
            log.debug("[" + message.getMessageProperties().getReceivedRoutingKey() + "]: " + xStream.toXML(secureMessage) + ": " + xStream.toXML(message));
        }
        // and send it over to the encrypted exchange
        rabbitTemplate.convertAndSend(encryptedExchange.getName(), message.getMessageProperties().getReceivedRoutingKey(), secureMessage);
    }


    /**
     * @param plain
     * @return
     * @throws InvalidKeyException
     * @throws SignatureException
     * @throws InvalidAlgorithmParameterException
     * @throws BadPaddingException
     * @throws IllegalBlockSizeException
     */
    private SecureMessage encryptMessage(byte[] plain) throws InvalidKeyException, SignatureException, InvalidAlgorithmParameterException, BadPaddingException, IllegalBlockSizeException {
        SecureMessage secureMessage = new SecureMessage();

        // crypt text
        SecretKey symmetricalKey = keyGeneratorSymmetricalKey.generateKey();
        IvParameterSpec ivParameterClient = new IvParameterSpec(secureRandom.generateSeed(16));

        synchronized (cipherSymmetricalKey) {
            cipherSymmetricalKey.init(Cipher.ENCRYPT_MODE, symmetricalKey, ivParameterClient);
            secureMessage.setEncryptedData(cipherSymmetricalKey.doFinal(plain));
            secureMessage.setIv(ivParameterClient.getIV());
        }

        // calculate digest,
        synchronized (digest) {
            byte[] msgDigest = new byte[digest.getDigestSize()];
            digest.update(secureMessage.getEncryptedData(), 0, secureMessage.getEncryptedData().length);
            digest.doFinal(msgDigest, 0);

            // sign the digest
            synchronized (signature) {
                signature.initSign(keyPair.getPrivate());
                signature.update(msgDigest);
            }
            secureMessage.setSignature(signature.sign());
        }

        // crypt aes key
        cipher.init(Cipher.WRAP_MODE, serverPublicKey);
        secureMessage.setEncryptedKey(cipher.wrap(symmetricalKey));

        return secureMessage;
    }
}
