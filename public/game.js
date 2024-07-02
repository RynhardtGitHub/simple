document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const messageElement = document.getElementById('message');
    let ball = null;
    let mazeDrawer = null;

    // Setup start button
    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', startGame);

    function startGame() {
        messageElement.textContent = "Game started!"; // Update the message
        startButton.disabled = true; // Disable the button after starting

        socket.emit('start');
    }

    // Receive map from server
    socket.on('maze', (maze) => {
        mazeDrawer = new DrawMaze(maze, ctx, canvas.width / maze.difficulty);

        console.log('Maze received');
        startButton.style.visibility = "hidden"; 
        messageElement.style.visibility = "hidden"; 

        // Initialize the ball
        ball = {
            x: maze.startCoord.x,
            y: maze.startCoord.y,
            radius: 5, 
            color: 'blue'
        };
        drawBall(ball); 
    });

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(response => {
            if (response === 'granted') {
                window.addEventListener('devicemotion', handleDeviceMotion);
            }
        }).catch(console.error);
    } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
    }

    function handleDeviceMotion(event) {
        const acceleration = event.accelerationIncludingGravity;
        const data = { x: acceleration.x, y: acceleration.y };
        console.log('Accelerometer data:', data);  // Debugging statement
        socket.emit('accelerometerData', data);
    }

    // Position updating
    socket.on('ballPosition', (data) => {
        ball.x -= data.x;
        ball.y += data.y;

        if (ball.x < 0) ball.x = 0;
        if (ball.x > canvas.width) ball.x = canvas.width;
        if (ball.y < 0) ball.y = 0;
        if (ball.y > canvas.height) ball.y = canvas.height;

        drawBall();
    });

    // Drawing
    function drawBall() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }

    // Maze drawing
    function DrawMaze(Maze, ctx, cellsize, endSprite = null) {
        var map = Maze.map;
        var cellSize = cellsize;
        var drawEndMethod;
        ctx.lineWidth = cellSize / 40;
      
        this.redrawMaze = function (size) {
          cellSize = size;
          ctx.lineWidth = cellSize / 50;
          drawMap();
          drawEndMethod();
        };
      
        function drawCell(xCord, yCord, cell) {
          var x = xCord * cellSize;
          var y = yCord * cellSize;
      
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
});


