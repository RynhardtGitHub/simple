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

// Difficulty progression
let difficulty = 5;
let difficultyAdd = 5;
let maze = new Maze(difficulty, difficulty);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    // Get players' data
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

    // Feed map to players
    socket.on('')
});

const port = 8080;
server.listen(port, () => {
    console.log(`listening on : ${port}`);
});


// Map generation
function rand(max) {
    return Math.floor(Math.random() * max);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.dirs = ["n", "s", "e", "w"];
        this.modDir = {
        n: { y: -1, x: 0, o: "s" },
        s: { y: 1, x: 0, o: "n" },
        e: { y: 0, x: 1, o: "w" },
        w: { y: 0, x: -1, o: "e" },
        };

        this.mazeMap = this.generateMap();
        this.startCoord = this.defineStartEnd()[0];
        this.endCoord = this.defineStartEnd()[1];

        this.generateMaze();
    }

    generateMap() {
        return Array.from({ length: this.height }, () =>
        Array.from({ length: this.width }, () => ({
            n: false, s: false, e: false, w: false,
            visited: false, priorPos: null
        }))
        );
    }

    defineStartEnd() {
        const side = rand(4); // 0: top, 1: right, 2: bottom, 3: left
        const isStartCorner = rand(2) === 0;

        let startX = side === 3 ? this.width - 1 : 0;
        let startY = side === 0 ? this.height - 1 : 0;
        let endX = side === 1 ? this.width - 1 : 0;
        let endY = side === 2 ? this.height - 1 : 0;

        if (!isStartCorner) {
        [startX, endX] = [endX, startX]; // Swap x-coords if not corner
        }
        if (side % 2 === 1) {
        [startY, endY] = [endY, startY]; // Swap y-coords if on right/left
        }

        return [
        { x: startX, y: startY },
        { x: endX, y: endY },
        ];
    }

    generateMaze() {
        let pos = { x: 0, y: 0 };
        let cellsVisited = 1;
        let numLoops = 0;
        let maxLoops = 0;

        while (cellsVisited < this.width * this.height) {
        this.mazeMap[pos.y][pos.x].visited = true;

        if (numLoops >= maxLoops) {
            shuffle(this.dirs);
            maxLoops = Math.round(rand(this.height / 8));
            numLoops = 0;
        }
        numLoops++;

        for (const dir of this.dirs) {
            const nx = pos.x + this.modDir[dir].x;
            const ny = pos.y + this.modDir[dir].y;
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && !this.mazeMap[ny][nx].visited) {
            this.mazeMap[pos.y][pos.x][dir] = true;
            this.mazeMap[ny][nx][this.modDir[dir].o] = true;
            this.mazeMap[ny][nx].priorPos = pos;
            pos = { x: nx, y: ny };
            cellsVisited++;
            break;
            }
        }
        if (!move) {
            pos = this.mazeMap[pos.y][pos.x].priorPos;
        }
        }
    }
}

