const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const config = require('./server/config/database');

// Connect To Database
mongoose.connect(config.database);

// On Connection
mongoose.connection.on('connected', function() {
    console.log('Connected to database '+config.database);
});

// On Error
mongoose.connection.on('error', function(err) {
    console.log('Database error '+err);
});

const chat = require('./server/routes/chat');

const port = process.env.PORT || 8080;

// CORS Middleware
app.use(cors());

app.use(express.static(path.join(__dirname, 'dist'), { redirect: false }));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/chat', chat);

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

var server = app.listen(port, function () {
    console.log('Server started on port '+ port);
});

var io = require('socket.io').listen(server);

io.on('connection', function (socket) {

    console.log('new connection made. '+socket.id);

    socket.on('disconnect', function () {

        var availableRooms = [];
        var rooms = io.sockets.adapter.rooms;
        if (rooms) {
            for (var room in rooms) {
                if (!rooms[room].hasOwnProperty(room)) {
                    availableRooms.push(room);
                }
            }
        }
        io.emit('online user', availableRooms);
    });

    socket.on('join', function(data){

        //socket.removeAllListeners();
        var availableRooms = [];
        var rooms = io.sockets.adapter.rooms;
        if (rooms) {
            for (var room in rooms) {
                if (!rooms[room].hasOwnProperty(room)) {
                    var onlineUser = Number(room);
                    if(!isNaN(onlineUser)) {
                        availableRooms.push(onlineUser);
                    } else {
                        delete io.sockets.adapter.rooms[room];
                    }
                }
            }
        }

        var online = availableRooms.find(x => x == data);
        if(!online) {
            socket.join(data);
            availableRooms.push(Number(data));
            io.sockets.adapter.rooms[data].unread = {};
            io.sockets.adapter.rooms[data].chatWith = '';
        }
        console.log(availableRooms);
        io.emit('online user', availableRooms);
        io.emit('notification', io.sockets.adapter.rooms);
        //console.log('joined the room : ' + data);
    });

    socket.on('leave', function(data){

        var allRoom = io.sockets.adapter.rooms[data]['sockets'];
        for (var prop in allRoom) {
            delete io.sockets.adapter.rooms[prop];
        }
        delete io.sockets.adapter.rooms[data];
        var availableRooms = [];
        var rooms = io.sockets.adapter.rooms;
        if (rooms) {
            for (var room in rooms) {
                if (!rooms[room].hasOwnProperty(room)) {
                    availableRooms.push(room);
                }
            }
        }
        io.emit('online user', availableRooms);
    });

    socket.on('chatWith', function(data){
        io.sockets.adapter.rooms[data.user].chatWith = data.to;
        io.sockets.adapter.rooms[data.user].unread[data.to] = null;
        io.emit('notification', io.sockets.adapter.rooms);
    });

    socket.on('message', function(data){

        if(io.sockets.adapter.rooms[data.to]) {
            if(io.sockets.adapter.rooms[data.to].chatWith != data.from) {
                const unread = io.sockets.adapter.rooms[data.to].unread[data.from] ? io.sockets.adapter.rooms[data.to].unread[data.from] : 0;
                io.sockets.adapter.rooms[data.to].unread[data.from] = unread + 1;
            }
        }
        io.emit('new message', data);
        io.emit('notification', io.sockets.adapter.rooms);
    });
});
