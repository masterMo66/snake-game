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
    this.themeButtons = document.querySelectorAll("[data-theme-option]");

    this.grid = { cols: 24, rows: 15 };
    this.baseStepDuration = 150;
    this.minStepDuration = 84;
    this.maxStepsPerFrame = 3;
    this.inputDebounceMs = 42;
    this.cellSize = 24;
    this.boardOffset = { x: 0, y: 0 };
    this.dpr = window.devicePixelRatio || 1;
    this.lastFrameTime = 0;
    this.lastDirectionInputAt = 0;
    this.lastMoveSoundAt = 0;
    this.particles = [];
    this.screenShake = 0;
    this.themeName = localStorage.getItem("snake-flow-theme") || "dawn";
    this.audioContext = null;
    this.masterGain = null;

    this.themes = {
      dawn: {
        status: "晨雾",
        frameTop: "rgba(255, 255, 255, 0.5)",
        frameBottom: "rgba(218, 224, 230, 0.22)",
        boardStart: "rgba(252, 250, 246, 0.98)",
        boardEnd: "rgba(230, 234, 239, 0.74)",
        boardGlow: "rgba(255, 255, 255, 0.22)",
        gridLine: "rgba(104, 112, 122, 0.075)",
        borderGlow: "rgba(255, 255, 255, 0.32)",
        ambientGlow: "rgba(255, 255, 255, 0.24)",
        foodCore: "#fff4d8",
        foodMid: "#ff9f7e",
        foodEdge: "#f36f53",
        foodShadow: "rgba(188, 92, 71, 0.28)",
        foodGlow: "rgba(255, 131, 103, 0.82)",
        particleColor: "255, 131, 103"
      },
      night: {
        status: "暗夜",
        frameTop: "rgba(74, 82, 95, 0.22)",
        frameBottom: "rgba(10, 13, 18, 0.58)",
        boardStart: "rgba(24, 28, 34, 0.98)",
        boardEnd: "rgba(14, 17, 21, 0.98)",
        boardGlow: "rgba(255, 255, 255, 0.03)",
        gridLine: "rgba(221, 228, 238, 0.065)",
        borderGlow: "rgba(255, 255, 255, 0.08)",
        ambientGlow: "rgba(168, 182, 204, 0.12)",
        foodCore: "#fff8c1",
        foodMid: "#ffd361",
        foodEdge: "#ffb11e",
        foodShadow: "rgba(255, 177, 30, 0.24)",
        foodGlow: "rgba(255, 200, 92, 0.78)",
        particleColor: "255, 196, 86"
      },
      cyber: {
        status: "赛博",
        frameTop: "rgba(0, 255, 231, 0.12)",
        frameBottom: "rgba(10, 12, 20, 0.62)",
        boardStart: "rgba(25, 28, 35, 0.98)",
        boardEnd: "rgba(16, 19, 27, 0.98)",
        boardGlow: "rgba(0, 255, 231, 0.08)",
        gridLine: "rgba(122, 255, 243, 0.1)",
        borderGlow: "rgba(0, 255, 231, 0.2)",
        ambientGlow: "rgba(0, 255, 231, 0.14)",
        foodCore: "#f9ffd2",
        foodMid: "#f8ff58",
        foodEdge: "#d0ff21",
        foodShadow: "rgba(155, 255, 0, 0.28)",
        foodGlow: "rgba(236, 255, 87, 0.88)",
        particleColor: "236, 255, 87"
      }
    };

    this.bestScore = Number(localStorage.getItem("snake-flow-best") || 0);

    this.reset();
    this.bindEvents();
    this.applyTheme(this.themeName);
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
    this.lastDirectionInputAt = 0;
    this.lastMoveSoundAt = 0;
    this.particles = [];
    this.screenShake = 0;
    this.scoreElement.textContent = "0";
    this.statusElement.textContent = "Ready";
    this.finalScoreElement.textContent = "0";
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resizeCanvas());
    document.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.startButton.addEventListener("click", () => {
      this.ensureAudioReady();
      this.start();
    });
    this.restartButton.addEventListener("click", () => {
      this.ensureAudioReady();
      this.restart();
    });

    this.touchButtons.forEach((button) => {
      const apply = () => {
        this.ensureAudioReady();
        this.applyDirection(button.dataset.direction);
      };
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

    this.themeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.ensureAudioReady();
        this.applyTheme(button.dataset.themeOption);
      });
    });
  }

  ensureAudioReady() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.32;
      this.masterGain.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  playMoveSound() {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(160, now);
    oscillator.frequency.exponentialRampToValueAtTime(116, now + 0.065);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(280, now);
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.012, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  playEatSound() {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    const now = this.audioContext.currentTime;
    const pop = this.audioContext.createOscillator();
    const sparkle = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    pop.type = "sine";
    pop.frequency.setValueAtTime(520, now);
    pop.frequency.exponentialRampToValueAtTime(760, now + 0.04);
    pop.frequency.exponentialRampToValueAtTime(420, now + 0.18);

    sparkle.type = "triangle";
    sparkle.frequency.setValueAtTime(980, now);
    sparkle.frequency.exponentialRampToValueAtTime(1320, now + 0.05);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.value = 1.3;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    pop.connect(filter);
    sparkle.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    pop.start(now);
    sparkle.start(now);
    pop.stop(now + 0.22);
    sparkle.stop(now + 0.12);
  }

  playGameOverSound() {
    if (!this.audioContext || !this.masterGain) {
      return;
    }

    const now = this.audioContext.currentTime;
    const chord = [196, 246.94, 293.66];

    chord.forEach((frequency, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      oscillator.type = index === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + 0.86);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(520, now);
      filter.Q.value = 0.7;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045 / (index + 1), now + 0.05 + index * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      oscillator.start(now + index * 0.015);
      oscillator.stop(now + 1.0);
    });
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      return;
    }

    this.themeName = themeName;
    document.body.dataset.theme = themeName;
    localStorage.setItem("snake-flow-theme", themeName);

    this.themeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.themeOption === themeName);
    });
  }

  start() {
    this.reset();
    this.running = true;
    this.lastStepTime = performance.now();
    this.startOverlay.classList.remove("overlay-visible");
    this.gameOverOverlay.classList.remove("overlay-visible");
    this.statusElement.textContent = this.themes[this.themeName].status;
  }

  restart() {
    this.start();
  }

  handleKeydown(event) {
    this.ensureAudioReady();

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

    const themeMap = {
      Digit1: "dawn",
      Digit2: "night",
      Digit3: "cyber"
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

    if (themeMap[event.code]) {
      this.applyTheme(themeMap[event.code]);
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

    const now = performance.now();
    if (this.pendingDirection || (this.running && now - this.lastDirectionInputAt < this.inputDebounceMs)) {
      return;
    }

    if (candidate.x === -this.direction.x && candidate.y === -this.direction.y) {
      return;
    }

    this.pendingDirection = candidate;
    this.lastDirectionInputAt = now;
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
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }

    const delta = Math.min(32, timestamp - this.lastFrameTime);
    this.lastFrameTime = timestamp;
    this.updateEffects(delta);

    if (this.running && !this.gameOver) {
      let elapsed = timestamp - this.lastStepTime;
      let steps = 0;

      while (
        elapsed >= this.currentStepDuration &&
        this.running &&
        !this.gameOver &&
        steps < this.maxStepsPerFrame
      ) {
        this.step(timestamp);
        this.lastStepTime += this.currentStepDuration;
        elapsed = timestamp - this.lastStepTime;
        steps += 1;
      }

      if (steps === this.maxStepsPerFrame && elapsed >= this.currentStepDuration) {
        this.lastStepTime = timestamp;
      }
    }

    const progress = this.running && !this.gameOver
      ? Math.min(1, (timestamp - this.lastStepTime) / this.currentStepDuration)
      : this.gameOver
        ? 1
        : 0;

    this.render(progress, timestamp);
    requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
  }

  updateEffects(delta) {
    this.screenShake = Math.max(0, this.screenShake - delta * 0.014);

    this.particles = this.particles.filter((particle) => {
      particle.velocityY += particle.gravity * delta;
      particle.x += particle.velocityX * delta;
      particle.y += particle.velocityY * delta;
      particle.rotation += particle.spin * delta;
      particle.life -= delta;
      return particle.life > 0;
    });
  }

  step(timestamp) {
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

    if (timestamp - this.lastMoveSoundAt > 92) {
      this.playMoveSound();
      this.lastMoveSoundAt = timestamp;
    }

    if (willGrow) {
      const burstSource = { ...this.food };
      this.score += 10;
      this.scoreElement.textContent = String(this.score);
      this.finalScoreElement.textContent = String(this.score);
      this.playEatSound();
      this.spawnFoodBurst(burstSource);
      this.screenShake = Math.max(this.screenShake, this.cellSize * 0.08);
      this.food = this.randomFood();
      this.currentStepDuration = Math.max(
        this.minStepDuration,
        this.baseStepDuration - Math.floor(this.score / 50) * 8
      );
    } else {
      this.snake.pop();
    }
  }

  spawnFoodBurst(foodPoint) {
    const palette = this.themes[this.themeName];
    const center = this.cellCenter(foodPoint);
    const count = 34;

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.06 + Math.random() * 0.17) * this.cellSize;
      this.particles.push({
        x: center.x,
        y: center.y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - this.cellSize * 0.02,
        gravity: 0.00042 * this.cellSize,
        life: 360 + Math.random() * 280,
        maxLife: 640,
        size: 1.2 + Math.random() * (this.cellSize * 0.09),
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        color: palette.particleColor
      });
    }
  }

  finish() {
    this.running = false;
    this.gameOver = true;
    this.statusElement.textContent = "Crashed";
    this.finalScoreElement.textContent = String(this.score);
    this.playGameOverSound();
    this.gameOverOverlay.classList.add("overlay-visible");

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("snake-flow-best", String(this.bestScore));
      this.bestScoreElement.textContent = String(this.bestScore);
    }
  }

  render(progress, timestamp) {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);
    this.drawBackground(width, height);
    this.drawBoard();
    this.drawFood(progress, timestamp);
    this.drawParticles();
    this.drawSnake(progress);
    this.drawAmbientHighlights(width, height);
    this.ctx.restore();
  }

  drawBackground(width, height) {
    const palette = this.themes[this.themeName];
    const background = this.ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, palette.frameTop);
    background.addColorStop(1, palette.frameBottom);
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
    boardGradient.addColorStop(0, palette.boardStart);
    boardGradient.addColorStop(1, palette.boardEnd);

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

    this.ctx.strokeStyle = palette.borderGlow;
    this.ctx.lineWidth = this.themeName === "cyber" ? 1.2 : 1;
    this.ctx.stroke();

    if (this.themeName === "cyber") {
      this.ctx.shadowBlur = 16;
      this.ctx.shadowColor = palette.borderGlow;
      this.ctx.strokeStyle = "rgba(124, 255, 243, 0.14)";
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawBoard() {
    const palette = this.themes[this.themeName];

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    const width = this.grid.cols * this.cellSize;
    const height = this.grid.rows * this.cellSize;

    this.ctx.strokeStyle = palette.gridLine;
    this.ctx.lineWidth = 0.6;

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

    if (this.themeName === "cyber") {
      this.ctx.strokeStyle = "rgba(113, 255, 242, 0.06)";
      this.ctx.lineWidth = 1;
      this.roundRect(
        this.ctx,
        this.cellSize * 0.2,
        this.cellSize * 0.2,
        width - this.cellSize * 0.4,
        height - this.cellSize * 0.4,
        this.cellSize * 0.72
      );
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawFood(progress, timestamp) {
    const palette = this.themes[this.themeName];
    const pulse = 0.9 + Math.sin(timestamp / 220) * 0.08;
    const center = this.cellCenter(this.food);
    const radius = this.cellSize * 0.26 * pulse;

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    const glow = this.ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, this.cellSize * 1.12);
    glow.addColorStop(0, palette.foodGlow);
    glow.addColorStop(0.55, this.withAlpha(palette.particleColor, 0.34));
    glow.addColorStop(1, this.withAlpha(palette.particleColor, 0));

    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, this.cellSize * 0.92, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = palette.foodShadow;
    this.ctx.beginPath();
    this.ctx.ellipse(
      center.x,
      center.y + this.cellSize * 0.24,
      this.cellSize * 0.28,
      this.cellSize * 0.12,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    const body = this.ctx.createRadialGradient(
      center.x - this.cellSize * 0.12,
      center.y - this.cellSize * 0.14,
      this.cellSize * 0.05,
      center.x,
      center.y,
      this.cellSize * 0.4
    );
    body.addColorStop(0, palette.foodCore);
    body.addColorStop(0.4, palette.foodMid);
    body.addColorStop(1, palette.foodEdge);

    this.ctx.fillStyle = body;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    this.ctx.beginPath();
    this.ctx.ellipse(
      center.x - this.cellSize * 0.12,
      center.y - this.cellSize * 0.12,
      this.cellSize * 0.09,
      this.cellSize * 0.06,
      Math.PI / 5,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.restore();
  }

  drawParticles() {
    if (this.particles.length === 0) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    this.particles.forEach((particle) => {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      this.ctx.save();
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation);
      this.ctx.fillStyle = this.withAlpha(particle.color, alpha * 0.95);
      this.ctx.beginPath();
      this.ctx.roundRect(-particle.size, -particle.size, particle.size * 2.4, particle.size * 1.4, particle.size * 0.6);
      this.ctx.fill();
      this.ctx.restore();
    });

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

  drawAmbientHighlights(width, height) {
    const palette = this.themes[this.themeName];
    const glow = this.ctx.createRadialGradient(
      width * 0.18,
      height * 0.12,
      0,
      width * 0.18,
      height * 0.12,
      width * 0.38
    );
    glow.addColorStop(0, palette.ambientGlow);
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

  withAlpha(rgb, alpha) {
    return `rgba(${rgb}, ${alpha})`;
  }
}

window.snakeFlow = new SnakeFlow();
