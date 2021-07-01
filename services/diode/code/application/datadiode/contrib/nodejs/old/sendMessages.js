var amqp = require('amqp');
var connection = amqp.createConnection({host: "rabbitblack", port: 5673});

var total = 2;
connection.on('ready', function () {
    connection.exchange("nodejsExchange", options = {
        type: 'headers',
        durable: true,
        autoDelete: false
    }, function (exchange) {

        var sendMessage = function (exchange, payload) {
            var encoded_payload = JSON.stringify(payload);
            exchange.publish('', encoded_payload, {})
        }

        setInterval(function () {
            var test_message = total + ", " + toBuffer(new ArrayBuffer(1024 * 192));
            console.log(' ..' + total + " to go ..")
            sendMessage(exchange, test_message)
            if (total == 0) {
                process.exit()
            }
            total = total - 1;
        }, 10)
    })
})

function toBuffer(ab) {
    var buffer = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }
    return buffer;
}

