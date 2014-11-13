#!/usr/bin/env node

var amqp = require('amqplib');
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var wpimg = require('wikipedia-image');
var config = require('./config');

app.listen(9001);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

amqp.connect(config.connection_string).then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {
    var ok = ch.assertExchange('wikipedia_hose', 'fanout', {durable: false});
    ok = ok.then(function() {
      return ch.assertQueue('', {exclusive: true});
    });
    ok = ok.then(function(qok) {
      return ch.bindQueue(qok.queue, 'wikipedia_hose', '').then(function() {
        return qok.queue;
      });
    });
    ok = ok.then(function(queue) {
      return ch.consume(queue, emitMessage, {noAck: true});
    });
    return ok.then(function() {
      console.log(' [*] Waiting for logs. To exit press CTRL+C');
    });


    function emitMessage(msg) {
      try {
        var page_url = msg.content.wikipedia_page_url;
        if (page_url) {
          wpimg(page_url).then(function (image) {
            msg.content.image_url = image;
          }, function (e) {
            //
          });
        }
        io.emit('news',  JSON.parse(msg.content.toString()));
      } catch (e) {
        io.emit('news',  JSON.parse(msg.content.toString()));
      }
    }

  });
}).then(null, console.warn);

