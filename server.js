const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const cors = require('cors');
app.use(cors());

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('accelerometerData', (data) => {
        // console.log(data);

        // socket.broadcast.emit('ballPosition', data);
        socket.emit('ballPosition', data);
    });
});

const port = 8080;
server.listen(port, () => {
    console.log(`listening on : ${port}`);
});
