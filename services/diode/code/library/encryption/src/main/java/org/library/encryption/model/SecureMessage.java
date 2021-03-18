package org.library.encryption.model;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.bouncycastle.util.encoders.Base64;

import java.io.Serializable;
import java.lang.reflect.Field;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created by marcelmaatkamp on 20/10/15.
 */
public class SecureMessage implements Serializable {

    private static AtomicInteger atomicInteger = new AtomicInteger();
    private int index;
    private byte[] signature;
    private byte[] encryptedKey;
    private byte[] encryptedData;
    private byte[] iv;

    public SecureMessage() {
        index = atomicInteger.incrementAndGet();
    }

    public int getIndex() {
        return index;
    }

    public byte[] getSignature() {
        return signature;
    }

    public void setSignature(byte[] signature) {
        this.signature = signature;
    }

    public byte[] getEncryptedKey() {
        return encryptedKey;
    }

    public void setEncryptedKey(byte[] encryptedKey) {
        this.encryptedKey = encryptedKey;
    }

    public byte[] getEncryptedData() {
        return encryptedData;
    }

    public void setEncryptedData(byte[] encryptedData) {
        this.encryptedData = encryptedData;
    }

    public byte[] getIv() {
        return iv;
    }

    public void setIv(byte[] iv) {
        this.iv = iv;
    }

    public String toString() {
        return (new ReflectionToStringBuilder(this) {
            protected Object getValue(Field f) throws IllegalAccessException {
                if ("signature".equals(f.getName())) {
                    return Base64.toBase64String(signature);
                } else if ("encryptedKey".equals(f.getName())) {
                    return Base64.toBase64String(encryptedKey);
                } else if ("encryptedData".equals(f.getName())) {
                    return Base64.toBase64String(encryptedData);
                } else if ("iv".equals(f.getName())) {
                    return Base64.toBase64String(encryptedData);
                } else {
                    return super.getValue(f);
                }
            }
        }).toString();
    }
}
