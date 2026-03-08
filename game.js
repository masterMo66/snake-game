class SnakeFlow {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.frameElement = this.canvas.parentElement;

    this.scoreElement = document.getElementById("score");
    this.bestScoreElement = document.getElementById("best-score");
    this.statusElement = document.getElementById("status-text");
    this.finalScoreElement = document.getElementById("final-score");
    this.startOverlay = document.getElementById("start-overlay");
    this.gameOverOverlay = document.getElementById("game-over-overlay");
    this.startButton = document.getElementById("start-button");
    this.restartButton = document.getElementById("restart-button");
    this.touchButtons = document.querySelectorAll("[data-direction]");

    this.grid = { cols: 24, rows: 15 };
    this.baseStepDuration = 150;
    this.minStepDuration = 84;
    this.cellSize = 24;
    this.boardOffset = { x: 0, y: 0 };
    this.dpr = window.devicePixelRatio || 1;

    this.bestScore = Number(localStorage.getItem("snake-flow-best") || 0);

    this.reset();
    this.bindEvents();
    this.resizeCanvas();
    this.bestScoreElement.textContent = String(this.bestScore);
    requestAnimationFrame((timestamp) => this.animate(timestamp));
  }

  reset() {
    const midY = Math.floor(this.grid.rows / 2);

    this.snake = [
      { x: 7, y: midY },
      { x: 6, y: midY },
      { x: 5, y: midY },
      { x: 4, y: midY }
    ];
    this.previousSnake = this.snake.map((segment) => ({ ...segment }));
    this.direction = { x: 1, y: 0 };
    this.pendingDirection = null;
    this.food = this.randomFood();
    this.score = 0;
    this.running = false;
    this.gameOver = false;
    this.lastStepTime = 0;
    this.currentStepDuration = this.baseStepDuration;
    this.scoreElement.textContent = "0";
    this.statusElement.textContent = "Ready";
    this.finalScoreElement.textContent = "0";
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resizeCanvas());
    document.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.startButton.addEventListener("click", () => this.start());
    this.restartButton.addEventListener("click", () => this.restart());

    this.touchButtons.forEach((button) => {
      const apply = () => this.applyDirection(button.dataset.direction);
      button.addEventListener("click", apply);
      button.addEventListener(
        "touchstart",
        (event) => {
          event.preventDefault();
          apply();
        },
        { passive: false }
      );
    });
  }

  start() {
    this.reset();
    this.running = true;
    this.lastStepTime = performance.now();
    this.startOverlay.classList.remove("overlay-visible");
    this.gameOverOverlay.classList.remove("overlay-visible");
    this.statusElement.textContent = "Running";
  }

  restart() {
    this.start();
  }

  handleKeydown(event) {
    const directionMap = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right"
    };

    if (event.code === "Space" && this.gameOver) {
      event.preventDefault();
      this.restart();
      return;
    }

    if (event.code === "Enter" && !this.running && !this.gameOver) {
      event.preventDefault();
      this.start();
      return;
    }

    const mapped = directionMap[event.code];
    if (!mapped) {
      return;
    }

    event.preventDefault();
    this.applyDirection(mapped);
  }

  applyDirection(directionName) {
    if (!this.running && !this.gameOver) {
      this.start();
    }

    this.setDirection(directionName);
  }

  setDirection(directionName) {
    const vectors = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    const candidate = vectors[directionName];
    if (!candidate) {
      return;
    }

    const activeDirection = this.pendingDirection || this.direction;
    if (candidate.x === -activeDirection.x && candidate.y === -activeDirection.y) {
      return;
    }

    this.pendingDirection = candidate;
  }

  randomFood() {
    let food;

    do {
      food = {
        x: Math.floor(Math.random() * this.grid.cols),
        y: Math.floor(Math.random() * this.grid.rows)
      };
    } while (this.snake?.some((segment) => segment.x === food.x && segment.y === food.y));

    return food;
  }

  resizeCanvas() {
    const bounds = this.frameElement.getBoundingClientRect();
    const ratio = this.grid.cols / this.grid.rows;
    const width = bounds.width;
    const height = bounds.height;

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const drawableWidth = width * 0.94;
    const drawableHeight = height * 0.9;
    const boardWidth = Math.min(drawableWidth, drawableHeight * ratio);

    this.cellSize = Math.max(12, Math.floor(boardWidth / this.grid.cols));
    this.boardOffset.x = Math.round((width - this.cellSize * this.grid.cols) / 2);
    this.boardOffset.y = Math.round((height - this.cellSize * this.grid.rows) / 2);
  }

  animate(timestamp) {
    if (this.running && !this.gameOver) {
      let elapsed = timestamp - this.lastStepTime;
      while (elapsed >= this.currentStepDuration && this.running && !this.gameOver) {
        this.step();
        this.lastStepTime += this.currentStepDuration;
        elapsed = timestamp - this.lastStepTime;
      }
    }

    const progress = this.running && !this.gameOver
      ? Math.min(1, (timestamp - this.lastStepTime) / this.currentStepDuration)
      : this.gameOver
        ? 1
        : 0;

    this.render(progress);
    requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
  }

  step() {
    this.previousSnake = this.snake.map((segment) => ({ ...segment }));

    if (this.pendingDirection) {
      this.direction = this.pendingDirection;
      this.pendingDirection = null;
    }

    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    if (
      head.x < 0 ||
      head.x >= this.grid.cols ||
      head.y < 0 ||
      head.y >= this.grid.rows
    ) {
      this.finish();
      return;
    }

    const willGrow = head.x === this.food.x && head.y === this.food.y;
    const bodyToCheck = willGrow ? this.snake : this.snake.slice(0, -1);

    if (bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y)) {
      this.finish();
      return;
    }

    this.snake.unshift(head);

    if (willGrow) {
      this.score += 10;
      this.scoreElement.textContent = String(this.score);
      this.finalScoreElement.textContent = String(this.score);
      this.food = this.randomFood();
      this.currentStepDuration = Math.max(
        this.minStepDuration,
        this.baseStepDuration - Math.floor(this.score / 50) * 8
      );
    } else {
      this.snake.pop();
    }
  }

  finish() {
    this.running = false;
    this.gameOver = true;
    this.statusElement.textContent = "Crashed";
    this.finalScoreElement.textContent = String(this.score);
    this.gameOverOverlay.classList.add("overlay-visible");

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("snake-flow-best", String(this.bestScore));
      this.bestScoreElement.textContent = String(this.bestScore);
    }
  }

  render(progress) {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    this.ctx.clearRect(0, 0, width, height);
    this.drawBackground(width, height);
    this.drawBoard();
    this.drawFood(progress);
    this.drawSnake(progress);
    this.drawAmbientHighlights();
  }

  drawBackground(width, height) {
    const background = this.ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "rgba(255, 255, 255, 0.44)");
    background.addColorStop(1, "rgba(208, 213, 220, 0.18)");
    this.ctx.fillStyle = background;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    const boardGradient = this.ctx.createLinearGradient(
      0,
      0,
      this.grid.cols * this.cellSize,
      this.grid.rows * this.cellSize
    );
    boardGradient.addColorStop(0, "rgba(248, 245, 240, 0.94)");
    boardGradient.addColorStop(1, "rgba(220, 225, 232, 0.54)");

    this.roundRect(
      this.ctx,
      0,
      0,
      this.grid.cols * this.cellSize,
      this.grid.rows * this.cellSize,
      this.cellSize * 0.9
    );
    this.ctx.fillStyle = boardGradient;
    this.ctx.fill();
    this.ctx.restore();
  }

  drawBoard() {
    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    const width = this.grid.cols * this.cellSize;
    const height = this.grid.rows * this.cellSize;

    this.ctx.strokeStyle = "rgba(110, 120, 132, 0.08)";
    this.ctx.lineWidth = 1;

    for (let col = 1; col < this.grid.cols; col += 1) {
      const x = col * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    for (let row = 1; row < this.grid.rows; row += 1) {
      const y = row * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawFood(progress) {
    const pulse = 0.96 + Math.sin((performance.now() + progress * 200) / 210) * 0.04;
    const point = this.cellCenter(this.food);
    const radius = this.cellSize * 0.28 * pulse;

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    const glow = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, this.cellSize);
    glow.addColorStop(0, "rgba(247, 190, 172, 0.95)");
    glow.addColorStop(0.52, "rgba(220, 162, 145, 0.68)");
    glow.addColorStop(1, "rgba(220, 162, 145, 0)");

    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, this.cellSize * 0.8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(244, 209, 201, 0.95)";
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawSnake(progress) {
    const points = this.getInterpolatedSnake(progress).map((segment) => this.cellCenter(segment));
    if (points.length < 2) {
      return;
    }

    const pathPoints = this.buildSmoothPathPoints(points);
    const gradient = this.ctx.createLinearGradient(
      this.boardOffset.x + pathPoints[0].x,
      this.boardOffset.y + pathPoints[0].y,
      this.boardOffset.x + pathPoints[pathPoints.length - 1].x,
      this.boardOffset.y + pathPoints[pathPoints.length - 1].y
    );
    gradient.addColorStop(0, "#8fa2b2");
    gradient.addColorStop(0.55, "#708392");
    gradient.addColorStop(1, "#bcc8d2");

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    this.ctx.lineWidth = this.cellSize * 0.78;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.translate(0, -this.cellSize * 0.03);
    this.drawSmoothStroke(pathPoints);
    this.ctx.translate(0, this.cellSize * 0.03);

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = this.cellSize * 0.72;
    this.drawSmoothStroke(pathPoints);

    const head = pathPoints[0];
    const neck = pathPoints[1];
    const angle = Math.atan2(head.y - neck.y, head.x - neck.x);
    const headGradient = this.ctx.createRadialGradient(
      head.x - this.cellSize * 0.16,
      head.y - this.cellSize * 0.16,
      this.cellSize * 0.06,
      head.x,
      head.y,
      this.cellSize * 0.55
    );
    headGradient.addColorStop(0, "#dbe4eb");
    headGradient.addColorStop(1, "#7f95a5");
    this.ctx.fillStyle = headGradient;
    this.ctx.beginPath();
    this.ctx.arc(head.x, head.y, this.cellSize * 0.38, 0, Math.PI * 2);
    this.ctx.fill();

    this.drawHeadDetail(head, angle);
    this.drawTail(pathPoints[pathPoints.length - 1], pathPoints[pathPoints.length - 2]);
    this.ctx.restore();
  }

  drawHeadDetail(head, angle) {
    const eyeOffset = this.cellSize * 0.13;
    const eyeDistance = this.cellSize * 0.14;
    const forward = { x: Math.cos(angle), y: Math.sin(angle) };
    const normal = { x: -forward.y, y: forward.x };

    const leftEye = {
      x: head.x + forward.x * eyeOffset + normal.x * eyeDistance,
      y: head.y + forward.y * eyeOffset + normal.y * eyeDistance
    };
    const rightEye = {
      x: head.x + forward.x * eyeOffset - normal.x * eyeDistance,
      y: head.y + forward.y * eyeOffset - normal.y * eyeDistance
    };

    this.ctx.fillStyle = "rgba(247, 251, 254, 0.92)";
    this.ctx.beginPath();
    this.ctx.arc(leftEye.x, leftEye.y, this.cellSize * 0.045, 0, Math.PI * 2);
    this.ctx.arc(rightEye.x, rightEye.y, this.cellSize * 0.045, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(69, 78, 88, 0.78)";
    this.ctx.beginPath();
    this.ctx.arc(leftEye.x, leftEye.y, this.cellSize * 0.022, 0, Math.PI * 2);
    this.ctx.arc(rightEye.x, rightEye.y, this.cellSize * 0.022, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawTail(tail, beforeTail) {
    const angle = Math.atan2(tail.y - beforeTail.y, tail.x - beforeTail.x);
    const gradient = this.ctx.createRadialGradient(
      tail.x,
      tail.y,
      this.cellSize * 0.04,
      tail.x,
      tail.y,
      this.cellSize * 0.32
    );
    gradient.addColorStop(0, "#cbd5dd");
    gradient.addColorStop(1, "#7f95a5");
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.ellipse(
      tail.x,
      tail.y,
      this.cellSize * 0.24,
      this.cellSize * 0.18,
      angle,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  drawSmoothStroke(points) {
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      this.ctx.quadraticCurveTo(current.x, current.y, midX, midY);
    }

    const last = points[points.length - 1];
    this.ctx.lineTo(last.x, last.y);
    this.ctx.stroke();
  }

  buildSmoothPathPoints(points) {
    if (points.length <= 2) {
      return points;
    }

    const result = [points[0]];
    for (let index = 1; index < points.length - 1; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const next = points[index + 1];

      result.push({
        x: (previous.x + current.x * 2) / 3,
        y: (previous.y + current.y * 2) / 3
      });
      result.push({
        x: (next.x + current.x * 2) / 3,
        y: (next.y + current.y * 2) / 3
      });
    }
    result.push(points[points.length - 1]);

    return result;
  }

  getInterpolatedSnake(progress) {
    const visualSnake = [];
    const currentLength = this.snake.length;

    for (let index = 0; index < currentLength; index += 1) {
      const current = this.snake[index];
      const fallback = this.previousSnake[Math.min(index, this.previousSnake.length - 1)] || current;

      visualSnake.push({
        x: fallback.x + (current.x - fallback.x) * progress,
        y: fallback.y + (current.y - fallback.y) * progress
      });
    }

    return visualSnake;
  }

  drawAmbientHighlights() {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const glow = this.ctx.createRadialGradient(
      width * 0.18,
      height * 0.12,
      0,
      width * 0.18,
      height * 0.12,
      width * 0.38
    );
    glow.addColorStop(0, "rgba(255, 255, 255, 0.22)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, width, height);
  }

  cellCenter(point) {
    return {
      x: (point.x + 0.5) * this.cellSize,
      y: (point.y + 0.5) * this.cellSize
    };
  }

  roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }
}

window.snakeFlow = new SnakeFlow();
