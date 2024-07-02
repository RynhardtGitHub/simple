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
let started = false;
let currentMaze;

// Difficulty progression
let difficulty = 5;
let difficultyAdd = 5;

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
    if (!started) {
        socket.on('start', () => {
            let maze = new Maze(difficulty, difficulty);

            console.log(`Emitting maze: ${JSON.stringify(maze)}`)

            io.emit('maze', maze);

            started = true;
            currentMaze = maze;
        });
    } else {
        io.emit('maze', currentMaze);
    }
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

function Maze(Width, Height) {
    var mazeMap;
    var width = Width;
    var height = Height;
    var startCoord, endCoord;
    var dirs = ["n", "s", "e", "w"];
    var modDir = {
      n: {
        y: -1,
        x: 0,
        o: "s",
      },
      s: {
        y: 1,
        x: 0,
        o: "n",
      },
      e: {
        y: 0,
        x: 1,
        o: "w",
      },
      w: {
        y: 0,
        x: -1,
        o: "e",
      },
    };

    // this.map = mazeMap;
    // this.startCoord = startCoord;
    // this.endCoord = endCoord;
  
    function genMap() {
      mazeMap = new Array(height);
      for (y = 0; y < height; y++) {
        mazeMap[y] = new Array(width);
        for (x = 0; x < width; ++x) {
          mazeMap[y][x] = {
            n: false,
            s: false,
            e: false,
            w: false,
            visited: false,
            priorPos: null,
          };
        }
      }
    }
  
    function defineMaze() {
      var isComp = false;
      var move = false;
      var cellsVisited = 1;
      var numLoops = 0;
      var maxLoops = 0;
      var pos = {
        x: 0,
        y: 0,
      };
      var numCells = width * height;
      while (!isComp) {
        move = false;
        mazeMap[pos.x][pos.y].visited = true;
  
        if (numLoops >= maxLoops) {
          shuffle(dirs);
          maxLoops = Math.round(rand(height / 8));
          numLoops = 0;
        }
        numLoops++;
        for (index = 0; index < dirs.length; index++) {
          var direction = dirs[index];
          var nx = pos.x + modDir[direction].x;
          var ny = pos.y + modDir[direction].y;
  
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            //Check if the tile is already visited
            if (!mazeMap[nx][ny].visited) {
              //Carve through walls from this tile to next
              mazeMap[pos.x][pos.y][direction] = true;
              mazeMap[nx][ny][modDir[direction].o] = true;
  
              //Set Currentcell as next cells Prior visited
              mazeMap[nx][ny].priorPos = pos;
              //Update Cell position to newly visited location
              pos = {
                x: nx,
                y: ny,
              };
              cellsVisited++;
              //Recursively call this method on the next tile
              move = true;
              break;
            }
          }
        }
  
        if (!move) {
          //  If it failed to find a direction,
          //  move the current position back to the prior cell and Recall the method.
          pos = mazeMap[pos.x][pos.y].priorPos;
        }
        if (numCells == cellsVisited) {
          isComp = true;
        }
      }
    }
  
    function defineStartEnd() {
      switch (rand(4)) {
        case 0:
          startCoord = {
            x: 0,
            y: 0,
          };
          endCoord = {
            x: height - 1,
            y: width - 1,
          };
          break;
        case 1:
          startCoord = {
            x: 0,
            y: width - 1,
          };
          endCoord = {
            x: height - 1,
            y: 0,
          };
          break;
        case 2:
          startCoord = {
            x: height - 1,
            y: 0,
          };
          endCoord = {
            x: 0,
            y: width - 1,
          };
          break;
        case 3:
          startCoord = {
            x: height - 1,
            y: width - 1,
          };
          endCoord = {
            x: 0,
            y: 0,
          };
          break;
      }
    }
  
    genMap();
    defineStartEnd();
    defineMaze();

    return {
        map: mazeMap,
        startCoord: startCoord,
        endCoord: endCoord
    }
  }