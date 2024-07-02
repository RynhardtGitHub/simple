const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const cors = require('cors');
app.use(cors());

// User and Data Management
const globalDataAccumulator = [];
const MAX_DATA_POINTS = 10;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('accelerometerData', (data) => {
            globalDataAccumulator.push(data);
        if (globalDataAccumulator.length > MAX_DATA_POINTS) {
        globalDataAccumulator.shift(); // Remove oldest data
        }

        // Calculate overall average from all users
        const averageData = globalDataAccumulator.reduce((acc, curr) => {
        acc.x += curr.x;
        acc.y += curr.y;
        acc.z += curr.z;
        return acc;
        }, { x: 0, y: 0, z: 0 });
        averageData.x /= globalDataAccumulator.length;
        averageData.y /= globalDataAccumulator.length;
        averageData.z /= globalDataAccumulator.length;

        io.emit('ballPosition', data);
    });
});

const port = 8080;
server.listen(port, () => {
    console.log(`listening on : ${port}`);
});
