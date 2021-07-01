var amqp = require("amqp-ts");
var connection = new amqp.Connection("amqp://localhost:5674");
var queue = connection.declareQueue('udp_producer', {durable: true});

var packets = 0;

setInterval(function(){
  console.log('packets: ' + packets);
}, 1000);    

queue.activateConsumer(function(message) {
  // console.log('received message: ' + message.getContent());
  packets = packets + 1;
}, {noAck: true});
