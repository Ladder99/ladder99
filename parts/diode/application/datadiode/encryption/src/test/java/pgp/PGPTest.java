package pgp;

import org.bouncycastle.openpgp.PGPException;
import org.bouncycastle.openpgp.PGPPrivateKey;
import org.bouncycastle.openpgp.PGPPublicKey;
import org.junit.Test;
import org.library.encryption.pgp.PGPService;
import org.library.encryption.pgp.PGPUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.NoSuchProviderException;

/**
 * Created by marcelmaatkamp on 11/11/15.
 */
public class PGPTest {
    private static final Logger log = LoggerFactory.getLogger(PGPTest.class);


    String pubringFilename = "application/encryption/src/test/resources/pgp/pubring.gpg";
    String secringFilename = "application/encryption/src/test/resources/pgp/secring.gpg";

    @Autowired
    ApplicationContext applicationContext;


    @Autowired
    PGPService pgpService;

    @Test
    public void testKeys() throws IOException, PGPException, NoSuchProviderException {
        File secringResource = new File(secringFilename);
        File pubringResource = new File(pubringFilename);

        log.info("dir: " + new File(".").getCanonicalPath());
        PGPPrivateKey pgpPrivateKey = PGPUtils.findPrivateKey(new FileInputStream(secringResource), -2742202535458887244L, null);
        PGPPublicKey pgpPublicKey = PGPUtils.readPublicKey(new FileInputStream(pubringResource));
        log.info("priv: " + pgpPrivateKey);
        log.info("pub: " + pgpPublicKey);

    }
}
