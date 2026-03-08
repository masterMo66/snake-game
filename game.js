// Snake Game
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.gridWidth = this.canvas.width / this.gridSize;
        this.gridHeight = this.canvas.height / this.gridSize;
        
        // Game state
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameSpeed = 150; // ms
        this.gameRunning = false;
        this.gameOver = false;
        this.showGrid = true;
        this.soundEnabled = true;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.speedElement = document.getElementById('speed');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverScreen = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.gridToggle = document.getElementById('grid-toggle');
        this.soundToggle = document.getElementById('sound-toggle');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        
        // Audio elements
        this.eatSound = document.getElementById('eat-sound');
        this.gameOverSound = document.getElementById('gameover-sound');
        
        this.init();
    }
    
    init() {
        // Set high score
        this.highScoreElement.textContent = this.highScore;
        
        // Event listeners
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.gridToggle.addEventListener('change', () => {
            this.showGrid = this.gridToggle.checked;
            this.draw();
        });
        this.soundToggle.addEventListener('change', () => {
            this.soundEnabled = this.soundToggle.checked;
        });
        
        // On-screen control buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                this.handleControlButton(direction);
            });
            
            // Touch events for mobile
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.handleControlButton(direction);
            });
        });
        
        // Difficulty buttons
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficultyBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameSpeed = parseInt(btn.dataset.speed);
                this.updateSpeedDisplay();
            });
        });
        
        // Initialize game
        this.resetGame();
        this.draw();
    }
    
    resetGame() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.gameOver = false;
        this.gameOverScreen.style.display = 'none';
        this.generateFood();
    }
    
    startGame() {
        this.resetGame();
        this.gameRunning = true;
        this.startScreen.style.display = 'none';
        this.gameLoop();
    }
    
    restartGame() {
        this.resetGame();
        this.gameRunning = true;
        this.gameOverScreen.style.display = 'none';
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.update();
        this.draw();
        
        setTimeout(() => this.gameLoop(), this.gameSpeed);
    }
    
    update() {
        // Update direction
        this.direction = { ...this.nextDirection };
        
        // Calculate new head position
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check collision with walls
        if (head.x < 0 || head.x >= this.gridWidth || 
            head.y < 0 || head.y >= this.gridHeight) {
            this.endGame();
            return;
        }
        
        // Check collision with self
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check if food is eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreElement.textContent = this.score;
            
            if (this.soundEnabled) {
                this.eatSound.currentTime = 0;
                this.eatSound.play().catch(e => console.log("Audio play failed:", e));
            }
            
            this.generateFood();
            
            // Increase speed slightly every 5 foods
            if (this.score % 50 === 0 && this.gameSpeed > 50) {
                this.gameSpeed -= 10;
                this.updateSpeedDisplay();
            }
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }
    
    draw() {
        // Clear canvas with grass background
        this.ctx.fillStyle = '#2e7d32';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grass pattern
        this.drawGrid();
        
        // Draw snake (realistic green snake style)
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Draw snake segment with gradient
            const gradient = this.ctx.createRadialGradient(
                x + this.gridSize / 2,
                y + this.gridSize / 2,
                0,
                x + this.gridSize / 2,
                y + this.gridSize / 2,
                this.gridSize / 2
            );
            
            if (isHead) {
                // Snake head - darker green
                gradient.addColorStop(0, '#2e7d32');
                gradient.addColorStop(1, '#1b5e20');
            } else {
                // Snake body - lighter green
                gradient.addColorStop(0, '#4caf50');
                gradient.addColorStop(1, '#388e3c');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 5);
            this.ctx.fill();
            
            // Add scale pattern for body segments
            if (!isHead && index % 2 === 0) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.beginPath();
                this.ctx.ellipse(
                    x + this.gridSize / 2,
                    y + this.gridSize / 2,
                    this.gridSize / 4,
                    this.gridSize / 6,
                    0,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
            
            // Draw eyes on head
            if (isHead) {
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = this.gridSize / 6;
                const pupilSize = eyeSize / 2;
                
                // Calculate eye positions based on direction
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                
                if (this.direction.x === 1) { // Right
                    leftEyeX = x + this.gridSize - eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + this.gridSize - eyeSize * 2;
                    rightEyeY = y + this.gridSize - eyeSize * 2;
                } else if (this.direction.x === -1) { // Left
                    leftEyeX = x + eyeSize * 1.5;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + eyeSize * 1.5;
                    rightEyeY = y + this.gridSize - eyeSize * 2;
                } else if (this.direction.y === 1) { // Down
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + this.gridSize - eyeSize * 1.5;
                    rightEyeX = x + this.gridSize - eyeSize * 2;
                    rightEyeY = y + this.gridSize - eyeSize * 1.5;
                } else { // Up
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + eyeSize * 1.5;
                    rightEyeX = x + this.gridSize - eyeSize * 2;
                    rightEyeY = y + eyeSize * 1.5;
                }
                
                // Draw eyes
                this.ctx.beginPath();
                this.ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
                this.ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw pupils
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(leftEyeX, leftEyeY, pupilSize, 0, Math.PI * 2);
                this.ctx.arc(rightEyeX, rightEyeY, pupilSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw tongue when moving
                if (this.direction.x !== 0 || this.direction.y !== 0) {
                    this.ctx.strokeStyle = '#ff6b6b';
                    this.ctx.lineWidth = 2;
                    this.ctx.lineCap = 'round';
                    
                    let tongueStartX, tongueStartY, tongueEndX, tongueEndY;
                    
                    if (this.direction.x === 1) { // Right
                        tongueStartX = x + this.gridSize;
                        tongueStartY = y + this.gridSize / 2;
                        tongueEndX = tongueStartX + this.gridSize / 3;
                        tongueEndY = tongueStartY;
                    } else if (this.direction.x === -1) { // Left
                        tongueStartX = x;
                        tongueStartY = y + this.gridSize / 2;
                        tongueEndX = tongueStartX - this.gridSize / 3;
                        tongueEndY = tongueStartY;
                    } else if (this.direction.y === 1) { // Down
                        tongueStartX = x + this.gridSize / 2;
                        tongueStartY = y + this.gridSize;
                        tongueEndX = tongueStartX;
                        tongueEndY = tongueStartY + this.gridSize / 3;
                    } else { // Up
                        tongueStartX = x + this.gridSize / 2;
                        tongueStartY = y;
                        tongueEndX = tongueStartX;
                        tongueEndY = tongueStartY - this.gridSize / 3;
                    }
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(tongueStartX, tongueStartY);
                    this.ctx.lineTo(tongueEndX, tongueEndY);
                    this.ctx.stroke();
                }
            }
        });
        
        // Draw frog food
        const foodX = this.food.x * this.gridSize;
        const foodY = this.food.y * this.gridSize;
        const frogSize = this.gridSize - 4;
        
        // Draw frog body (green)
        this.ctx.fillStyle = '#4caf50';
        this.ctx.beginPath();
        this.ctx.ellipse(
            foodX + this.gridSize / 2,
            foodY + this.gridSize / 2,
            frogSize / 2,
            frogSize / 2.5,
            0,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw frog eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            foodX + this.gridSize / 3,
            foodY + this.gridSize / 3,
            frogSize / 8,
            0,
            Math.PI * 2
        );
        this.ctx.arc(
            foodX + this.gridSize * 2 / 3,
            foodY + this.gridSize / 3,
            frogSize / 8,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw frog pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(
            foodX + this.gridSize / 3,
            foodY + this.gridSize / 3,
            frogSize / 16,
            0,
            Math.PI * 2
        );
        this.ctx.arc(
            foodX + this.gridSize * 2 / 3,
            foodY + this.gridSize / 3,
            frogSize / 16,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw frog mouth (smile)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(
            foodX + this.gridSize / 2,
            foodY + this.gridSize * 2 / 3,
            frogSize / 4,
            0,
            Math.PI
        );
        this.ctx.stroke();
        
        // Draw frog legs
        this.ctx.fillStyle = '#388e3c';
        this.ctx.beginPath();
        // Front left leg
        this.ctx.ellipse(
            foodX + this.gridSize / 4,
            foodY + this.gridSize * 3 / 4,
            frogSize / 6,
            frogSize / 8,
            Math.PI / 4,
            0,
            Math.PI * 2
        );
        // Front right leg
        this.ctx.ellipse(
            foodX + this.gridSize * 3 / 4,
            foodY + this.gridSize * 3 / 4,
            frogSize / 6,
            frogSize / 8,
            -Math.PI / 4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawGrid() {
        // Draw grass pattern instead of grid lines
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Draw subtle grid lines (optional, can be toggled)
        if (this.showGrid) {
            // Vertical lines
            for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
        }
        
        // Draw grass blades randomly
        this.ctx.strokeStyle = 'rgba(56, 142, 60, 0.4)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const height = 3 + Math.random() * 8;
            const angle = Math.random() * Math.PI / 4 - Math.PI / 8;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(
                x + Math.cos(angle) * height,
                y - Math.sin(angle) * height
            );
            this.ctx.stroke();
        }
        
        // Draw some flowers/plants
        this.ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = 1 + Math.random() * 3;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    generateFood() {
        let foodPosition;
        let validPosition = false;
        
        while (!validPosition) {
            foodPosition = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            
            validPosition = true;
            
            // Check if food overlaps with snake
            for (let segment of this.snake) {
                if (foodPosition.x === segment.x && foodPosition.y === segment.y) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        this.food = foodPosition;
    }
    
    handleControlButton(direction) {
        if (!this.gameRunning) return;
        
        switch (direction) {
            case 'up':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
                break;
            case 'down':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'left':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'right':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
                break;
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning) return;
        
        // Prevent default behavior for arrow keys
        if ([37, 38, 39, 40, 65, 87, 68, 83].includes(e.keyCode)) {
            e.preventDefault();
        }
        
        // Update direction based on key press
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
                break;
        }
    }
    
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.highScoreElement.textContent = this.highScore;
        }
        
        // Update final score
        this.finalScoreElement.textContent = this.score;
        
        // Show game over screen with crying snake
        this.gameOverScreen.style.display = 'flex';
        
        // Draw crying snake in the score area
        this.drawCryingSnake();
        
        // Play game over sound
        if (this.soundEnabled) {
            this.gameOverSound.currentTime = 0;
            this.gameOverSound.play().catch(e => console.log("Audio play failed:", e));
        }
    }
    
    drawCryingSnake() {
        // Draw a crying snake in the game over screen
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        
        // Draw sad snake body
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        // Snake body (curled up)
        ctx.ellipse(100, 75, 60, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sad snake head
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.ellipse(160, 75, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sad eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(150, 70, 8, 0, Math.PI * 2);
        ctx.arc(170, 70, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sad pupils (looking down)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(150, 73, 4, 0, Math.PI * 2);
        ctx.arc(170, 73, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tears
        ctx.fillStyle = '#2196f3';
        ctx.beginPath();
        // Left tear
        ctx.ellipse(148, 85, 3, 6, 0, 0, Math.PI * 2);
        // Right tear
        ctx.ellipse(172, 85, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sad mouth
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(160, 85, 15, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Add to game over screen
        const cryingSnakeContainer = document.getElementById('crying-snake');
        if (!cryingSnakeContainer) {
            const container = document.createElement('div');
            container.id = 'crying-snake';
            container.style.textAlign = 'center';
            container.style.margin = '20px 0';
            this.gameOverScreen.appendChild(container);
        }
        
        document.getElementById('crying-snake').innerHTML = '';
        document.getElementById('crying-snake').appendChild(canvas);
    }
    
    updateSpeedDisplay() {
        let speedText = 'Normal';
        if (this.gameSpeed <= 100) speedText = 'Fast';
        if (this.gameSpeed <= 70) speedText = 'Extreme';
        this.speedElement.textContent = speedText;
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    
    // Add touch controls for mobile
    const touchControls = document.createElement('div');
    touchControls.className = 'touch-controls';
    touchControls.innerHTML = `
        <div class="touch-row">
            <button class="touch-btn up">↑</button>
        </div>
        <div class="touch-row">
            <button class="touch-btn left">←</button>
            <button class="touch-btn down">↓</button>
            <button class="touch-btn right">→</button>
        </div>
    `;
    document.querySelector('.canvas-container').appendChild(touchControls);
    
    // Add touch control styles
    const style = document.createElement('style');
    style.textContent = `
        .touch-controls {
            display: none;
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            padding: 20px;
            justify-content: center;
            gap: 20px;
        }
        
        .touch-row {
            display: flex;
            gap: 20px;
            justify-content: center;
        }
        
        .touch-btn {
            width: 60px;
            height: 60px;
            background: rgba(0, 173, 181, 0.7);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 24px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            touch-action: manipulation;
        }
        
        .touch-btn:active {
            background: rgba(0, 173, 181, 1);
            transform: scale(0.95);
        }
        
        @media (max-width: 768px) {
            .touch-controls {
                display: flex;
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add touch control event listeners
    document.querySelectorAll('.touch-btn').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = btn.textContent;
            let event;
            
            switch (direction) {
                case '↑': event = new KeyboardEvent('keydown', { key: 'ArrowUp' }); break;
                case '↓': event = new KeyboardEvent('keydown', { key: 'ArrowDown' }); break;
                case '←': event = new KeyboardEvent('keydown', { key: 'ArrowLeft' }); break;
                case '→': event = new KeyboardEvent('keydown', { key: 'ArrowRight' }); break;
            }
            
            if (event) {
                game.handleKeyPress(event);
            }
        });
    });
});
