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
        // Clear canvas
        this.ctx.fillStyle = '#0d1117';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Draw segment
            this.ctx.fillStyle = isHead ? '#00adb5' : '#4db6ac';
            this.ctx.fillRect(x, y, this.gridSize, this.gridSize);
            
            // Add border
            this.ctx.strokeStyle = isHead ? '#007c91' : '#00897b';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
            
            // Draw eyes on head
            if (isHead) {
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = this.gridSize / 5;
                
                // Calculate eye positions based on direction
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                
                if (this.direction.x === 1) { // Right
                    leftEyeX = x + this.gridSize - eyeSize * 2;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + this.gridSize - eyeSize * 2;
                    rightEyeY = y + this.gridSize - eyeSize * 2;
                } else if (this.direction.x === -1) { // Left
                    leftEyeX = x + eyeSize;
                    leftEyeY = y + eyeSize * 2;
                    rightEyeX = x + eyeSize;
                    rightEyeY = y + this.gridSize - eyeSize * 2;
                } else if (this.direction.y === 1) { // Down
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + this.gridSize - eyeSize * 2;
                    rightEyeX = x + this.gridSize - eyeSize * 2;
                    rightEyeY = y + this.gridSize - eyeSize * 2;
                } else { // Up
                    leftEyeX = x + eyeSize * 2;
                    leftEyeY = y + eyeSize;
                    rightEyeX = x + this.gridSize - eyeSize * 2;
                    rightEyeY = y + eyeSize;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
                this.ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw food
        const foodX = this.food.x * this.gridSize;
        const foodY = this.food.y * this.gridSize;
        
        // Draw apple-like food
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(
            foodX + this.gridSize / 2,
            foodY + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Add shine effect
        this.ctx.fillStyle = '#ff9e9e';
        this.ctx.beginPath();
        this.ctx.arc(
            foodX + this.gridSize / 3,
            foodY + this.gridSize / 3,
            this.gridSize / 6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Add stem
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(
            foodX + this.gridSize / 2 - 1,
            foodY + 2,
            2,
            this.gridSize / 4
        );
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
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
        
        // Show game over screen
        this.gameOverScreen.style.display = 'flex';
        
        // Play game over sound
        if (this.soundEnabled) {
            this.gameOverSound.currentTime = 0;
            this.gameOverSound.play().catch(e => console.log("Audio play failed:", e));
        }
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
