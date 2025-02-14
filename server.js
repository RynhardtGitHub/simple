const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Start canvas on server to do collision detection
const { createCanvas } = require('canvas');

// CORS dependencies
const cors = require('cors');
app.use(cors());

// User and Data Management
const globalDataAccumulator = [];
const MAX_DATA_POINTS = 20;
let started = false;
let currentMaze;
let playerCount = 0;
let canvaswidth = 400;
let radius = 10;
let canvas;
let ctx;
let cellsize;
let ball_location;

// Difficulty progression
let difficulty = 5;
let difficultyAdd = 5;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
    playerCount += 1;
    cellsize = canvaswidth / difficulty;

    socket.on('disconnect', () => {
        playerCount -= 1;
        console.log(`User disconnected: ${playerCount} players left.`);

        if (playerCount == 0) {
            started = false;
            currentMaze = null;
        }
    });

    // Feed map to players
    if (!started) {
        socket.on('start', () => {
            let maze = new Maze(difficulty, difficulty);

            console.log(`Emitting maze: ${JSON.stringify(maze)}`)

            io.emit('maze', maze);

            if (!canvas) canvas = createCanvas(canvaswidth, canvaswidth);
            ctx = canvas.getContext('2d');
            DrawMaze(maze,ctx,cellsize);

            ball_location = {x:maze.startCoord.x * cellsize, y:maze.startCoord.y * cellsize};

            // console.log(`Virtual canvas: ${(ctx.getImageData(0,0,canvaswidth,canvaswidth).data)}`);

            started = true;
            currentMaze = maze;
        });
    } else {
        io.emit('maze', currentMaze);
    }

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

        // Collision detection
        if (ctx && ball_location) {
            const ballCenterX = ball_location.x;
            const ballCenterY = ball_location.y;
            for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) { // Check 16 points around the circle
                const x = ballCenterX + radius * Math.cos(angle);
                const y = ballCenterY + radius * Math.sin(angle);
            
                // Get pixel data at the point
                const pixelData = ctx.getImageData(x, y, 1, 1).data;
            
                // Check if the pixel is black (or very dark)
                if (pixelData[0] < 100 && pixelData[1] < 100 && pixelData[2] < 100) {
                    console.log(`Collision detected!`);
                    // For now, a simple inversion of accelerometer data:
                    data.x = data.x;
                    data.y = data.y;
                    break; // Stop checking once a collision is found
                } else {
                    data.x = -data.x;
                    data.y = -data.y;
                }
            }
            ball_location.x += data.x;
            ball_location.y += data.y;
        }

        io.emit('ballPosition', data);

        // if (ctx) {
            // console.log(`Virtual canvas: ${(ctx.getImageData(0,0,canvaswidth,canvaswidth).data)}`);
        // }
    });
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
        endCoord: endCoord,
        difficulty: difficulty
    }
}

function DrawMaze(Maze, ctx, cellsize, endSprite = null) {

    // console.log('Entered DrawMaze');

    var map = Maze.map;
    var cellSize = cellsize;

    // console.log(`cellsize: ${cellsize}`);

    var drawEndMethod;
    ctx.lineWidth = cellSize / 40;

    // console.log(`linewidth: ${ctx.lineWidth}`);
  
    this.redrawMaze = function (size) {
      cellSize = size;
      ctx.lineWidth = cellSize / 50;
      drawMap();
      drawEndMethod();
    };
  
    function drawCell(xCord, yCord, cell) {
      var x = xCord * cellSize;
      var y = yCord * cellSize;

    //   console.log(`drawCell: ${x, y}`);
  
      if (cell.n == false) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();
      }
      if (cell.s === false) {
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (cell.e === false) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (cell.w === false) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
      }
    }
  
    function drawMap() {
      for (x = 0; x < map.length; x++) {
        for (y = 0; y < map[x].length; y++) {
          drawCell(x, y, map[x][y]);
        }
      }
    }
  
    function drawEndFlag() {
      var coord = Maze.endCoord;
      var gridSize = 4;
      var fraction = cellSize / gridSize - 2;
      var colorSwap = true;
      for (let y = 0; y < gridSize; y++) {
        if (gridSize % 2 == 0) {
          colorSwap = !colorSwap;
        }
        for (let x = 0; x < gridSize; x++) {
          ctx.beginPath();
          ctx.rect(
            coord.x * cellSize + x * fraction + 4.5,
            coord.y * cellSize + y * fraction + 4.5,
            fraction,
            fraction
          );
          if (colorSwap) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          }
          ctx.fill();
          colorSwap = !colorSwap;
        }
      }
    }
  
    function drawEndSprite() {
      var offsetLeft = cellSize / 50;
      var offsetRight = cellSize / 25;
      var coord = Maze.endCoord;
      ctx.drawImage(
        endSprite,
        2,
        2,
        endSprite.width,
        endSprite.height,
        coord.x * cellSize + offsetLeft,
        coord.y * cellSize + offsetLeft,
        cellSize - offsetRight,
        cellSize - offsetRight
      );
    }
  
    function clear() {
      var canvasSize = cellSize * map.length;
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    }
  
    if (endSprite != null) {
      drawEndMethod = drawEndSprite;
    } else {
      drawEndMethod = drawEndFlag;
    }
    clear();
    drawMap();
    drawEndMethod();
}