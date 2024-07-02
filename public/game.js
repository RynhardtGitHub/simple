document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const initialX = canvas.width / 2;
    const initialY = canvas.height / 2;
    let ball = { x: initialX, y: initialY, radius: 10 };

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
    function DrawMaze(Maze, ctx, cellSize, endSprite = null) {
        ctx.lineWidth = cellSize / 40;
      
        this.redrawMaze = function (size) {
          cellSize = size;
          ctx.lineWidth = cellSize / 50;
          drawMap();
          drawEndMethod();
        };
      
        function drawCell(xCord, yCord, cell) {
          const x = xCord * cellSize;
          const y = yCord * cellSize;
      
          if (!cell.n) { // Access properties directly (no "==" false needed)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellSize, y);
            ctx.stroke();
          }
          if (!cell.s) {
            ctx.beginPath();
            ctx.moveTo(x, y + cellSize);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
          }
          if (!cell.e) {
            ctx.beginPath();
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.stroke();
          }
          if (!cell.w) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cellSize);
            ctx.stroke();
          }
        }
      
        function drawMap() {
          for (let x = 0; x < Maze.width; x++) { // Use Maze.width
            for (let y = 0; y < Maze.height; y++) { // Use Maze.height
              drawCell(x, y, Maze.mazeMap[y][x]); // Access using Maze.mazeMap
            }
          }
        }
      
        // ... (drawEndFlag and drawEndSprite functions remain the same)
      
        function clear() {
          const canvasSize = cellSize * Maze.width; // Use Maze.width
          ctx.clearRect(0, 0, canvasSize, canvasSize);
        }
      
        // Determine drawEndMethod based on endSprite
        const drawEndMethod = endSprite ? drawEndSprite : drawEndFlag; 
      
        clear();
        drawMap();
        drawEndMethod();
    }      
});


