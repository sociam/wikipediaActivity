var amqp = require('amqplib');
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var _ = require('underscore');
var wpimg = require('wikipedia-image');
var config = require('./config');

app.listen(9001);

function handler (req, res) {
    res.writeHead(200);
    res.end("");
}

var filter = {
    "filter": false,
}; // global filter state, and default

io.on('connection', function (socket) {
    socket.emit("filter", filter); // emit the current state to this client

    // receive a filter update, combine it and send to ALL clients
    socket.on('filter', function (newFilter) {
        //console.log("filter updated:", newFilter);
        _.extend(filter, newFilter);
        //console.log("emitting filter:", filter); 
        io.emit("filter", filter);
    });
});

var emitWP = function (msg) {
    try {
        var data = JSON.parse(msg.content.toString());
        io.emit('wikipedia_revisions', data);

        var page_url = data.wikipedia_page_url;
        if (page_url) {
            wpimg(page_url).then(function (image) {
                if (image && image != "") {
                    io.emit('wikipedia_images', {"image_url": image, "data": data});
                }
            }, function (e) {
                // error querying etc
            });
        }
    } catch (e) {
        //
    }
}

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
            return ch.consume(queue, emitWP, {noAck: true});
        });

        return ok.then(function() {
            console.log(' [*] Waiting for logs. To exit press CTRL+C');
        });
    });
}).then(null, console.warn);

