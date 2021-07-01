var forge = require('node-forge');

var amqp = require('amqp');
var connection = amqp.createConnection({host: "rabbitmq", port: 5674});
var count = 1;

connection.on('ready', function () {
    connection.exchange("testExchange", options = {
        type: 'headers',
        durable: true,
        autoDelete: false
    }, function (exchange) {

        var sendMessage = function (exchange, payload) {


            var encoded_payload = JSON.stringify(payload);

            // RSA
            var rsa = forge.pki.rsa;
            var keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});


            var md = forge.md.sha1.create();
            md.update('sign this', 'utf8');
            var signature = privateKey.sign(md);

            var verified = publicKey.verify(md.digest().bytes(), signature);

            var md = forge.md.sha1.create();
            md.update('sign this', 'utf8');
            var pss = forge.pss.create({
                md: forge.md.sha1.create(),
                mgf: forge.mgf.mgf1.create(forge.md.sha1.create()),
                saltLength: 20
            });
            var signature = privateKey.sign(md, pss);

            var pss = forge.pss.create({
                md: forge.md.sha1.create(),
                mgf: forge.mgf.mgf1.create(forge.md.sha1.create()),
                saltLength: 20
            });
            var md = forge.md.sha1.create();
            md.update('sign this', 'utf8');
            publicKey.verify(md.digest().getBytes(), signature, pss);

            var encrypted = publicKey.encrypt(bytes);

// AES

            var key = forge.random.getBytesSync(16);
            var iv = forge.random.getBytesSync(16);

            var cipher = forge.cipher.createCipher('AES-CBC', key);
            cipher.start({iv: iv});
            cipher.update(forge.util.createBuffer(someBytes));
            cipher.finish();
            var encrypted = cipher.output;
            console.log(encrypted.toHex());

            /**
             var decipher = forge.cipher.createDecipher('AES-CBC', key);
             decipher.start({iv: iv});
             decipher.update(encrypted);
             decipher.finish();
             console.log(decipher.output.toHex());
             */
            exchange.publish('', encoded_payload, {})
        }

        setInterval(function () {
            var test_message = 'TEST ' + count
            console.log('send ' + count + " ..")
            sendMessage(exchange, test_message)
            count += 1;
        }, 1000)
    })
})
