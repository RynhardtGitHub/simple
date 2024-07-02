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

    socket.on('ballPosition', (data) => {
        ball.x += data.x;
        ball.y += data.y;

        if (ball.x < 0) ball.x = 0;
        if (ball.x > canvas.width) ball.x = canvas.width;
        if (ball.y < 0) ball.y = 0;
        if (ball.y > canvas.height) ball.y = canvas.height;

        drawBall();
    });

    function drawBall() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }
});
