var dgram = require('dgram');
var amqp = require("amqp-ts");

var connection = new amqp.Connection("amqp://localhost:5674");
var exchange = connection.declareExchange("udp_producer", "fanout");

var socket = dgram.createSocket('udp4');
socket.bind(9999);
socket.on('message', function(msg, rinfo) {
    // console.log('Received %d bytes from %s:%d\n', msg.length, rinfo.address, rinfo.port);
    var message = new amqp.Message(msg);
    exchange.send(message);
});
