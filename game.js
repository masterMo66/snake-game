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
    this.maxStepsPerFrame = 3;
    this.inputDebounceMs = 42;
    this.cellSize = 24;
    this.boardOffset = { x: 0, y: 0 };
    this.dpr = window.devicePixelRatio || 1;
    this.lastFrameTime = 0;
    this.lastDirectionInputAt = 0;
    this.lastMoveSoundAt = 0;
    this.screenShake = 0;
    this.swallowPulse = 0;
    this.audioContext = null;
    this.masterGain = null;
    this.groundTexture = null;

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
    this.lastDirectionInputAt = 0;
    this.lastMoveSoundAt = 0;
    this.screenShake = 0;
    this.swallowPulse = 0;
    this.scoreElement.textContent = "0";
    this.statusElement.textContent = "Idle";
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

  start() {
    this.reset();
    this.running = true;
    this.lastStepTime = performance.now();
    this.startOverlay.classList.remove("overlay-visible");
    this.gameOverOverlay.classList.remove("overlay-visible");
    this.statusElement.textContent = "Tracking";
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
    let attempts = 0;

    do {
      food = {
        x: Math.floor(Math.random() * this.grid.cols),
        y: Math.floor(Math.random() * this.grid.rows)
      };
      attempts += 1;
    } while (this.snake?.some((segment) => segment.x === food.x && segment.y === food.y) && attempts < 500);

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
    this.buildGroundTexture();
  }

  buildGroundTexture() {
    const width = this.grid.cols * this.cellSize;
    const height = this.grid.rows * this.cellSize;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;
    const texture = textureCanvas.getContext("2d");

    const base = texture.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, "#31451f");
    base.addColorStop(0.5, "#27391a");
    base.addColorStop(1, "#1c2814");
    texture.fillStyle = base;
    texture.fillRect(0, 0, width, height);

    for (let i = 0; i < 2400; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 12 + Math.random() * 42;
      const patch = texture.createRadialGradient(x, y, radius * 0.12, x, y, radius);
      patch.addColorStop(0, `rgba(98, 126, 62, ${0.05 + Math.random() * 0.08})`);
      patch.addColorStop(1, "rgba(98, 126, 62, 0)");
      texture.fillStyle = patch;
      texture.beginPath();
      texture.arc(x, y, radius, 0, Math.PI * 2);
      texture.fill();
    }

    for (let i = 0; i < 240; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const rx = 18 + Math.random() * 48;
      const ry = 10 + Math.random() * 22;
      const mud = texture.createRadialGradient(x, y, rx * 0.1, x, y, rx);
      mud.addColorStop(0, `rgba(74, 54, 32, ${0.12 + Math.random() * 0.08})`);
      mud.addColorStop(1, "rgba(74, 54, 32, 0)");
      texture.fillStyle = mud;
      texture.beginPath();
      texture.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      texture.fill();
    }

    for (let i = 0; i < 34; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const rx = 24 + Math.random() * 62;
      const ry = 10 + Math.random() * 26;
      const puddle = texture.createRadialGradient(x, y, rx * 0.1, x, y, rx);
      puddle.addColorStop(0, "rgba(92, 103, 78, 0.2)");
      puddle.addColorStop(0.55, "rgba(53, 62, 52, 0.14)");
      puddle.addColorStop(1, "rgba(53, 62, 52, 0)");
      texture.fillStyle = puddle;
      texture.beginPath();
      texture.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      texture.fill();

      texture.fillStyle = "rgba(214, 219, 189, 0.06)";
      texture.beginPath();
      texture.ellipse(x - rx * 0.2, y - ry * 0.12, rx * 0.32, ry * 0.12, 0, 0, Math.PI * 2);
      texture.fill();
    }

    const bladeCount = Math.max(11000, Math.floor((width * height) / 58));
    for (let i = 0; i < bladeCount; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = 8 + Math.random() * 30;
      const bend = (Math.random() - 0.5) * 20;
      const hue = 90 + Math.random() * 26;
      const sat = 24 + Math.random() * 34;
      const light = 16 + Math.random() * 20;
      texture.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.16 + Math.random() * 0.42})`;
      texture.lineWidth = 0.45 + Math.random() * 1.45;
      texture.beginPath();
      texture.moveTo(x, y + length * 0.44);
      texture.quadraticCurveTo(x + bend * 0.25, y + length * 0.12, x + bend, y - length);
      texture.stroke();
    }

    for (let i = 0; i < 1800; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 0.4 + Math.random() * 1.2;
      texture.fillStyle = `rgba(224, 230, 204, ${0.02 + Math.random() * 0.06})`;
      texture.beginPath();
      texture.arc(x, y, radius, 0, Math.PI * 2);
      texture.fill();
    }

    this.groundTexture = textureCanvas;
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
    this.screenShake = Math.max(0, this.screenShake - delta * 0.012);
    this.swallowPulse = Math.max(0, this.swallowPulse - delta * 0.0044);
  }

  step(timestamp = performance.now()) {
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
      this.score += 10;
      this.scoreElement.textContent = String(this.score);
      this.finalScoreElement.textContent = String(this.score);
      this.playEatSound();
      this.swallowPulse = 1;
      this.screenShake = Math.max(this.screenShake, this.cellSize * 0.018);
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
    this.statusElement.textContent = "Lost Trail";
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
    this.drawGround(width, height, timestamp);
    this.drawFrogFood(timestamp);
    this.drawSnake(progress, timestamp);
    this.drawAtmosphere(width, height, timestamp);
    this.ctx.restore();
  }

  drawGround(width, height, timestamp) {
    const borderShadow = this.ctx.createLinearGradient(0, 0, 0, height);
    borderShadow.addColorStop(0, "rgba(17, 18, 12, 0.48)");
    borderShadow.addColorStop(1, "rgba(3, 4, 2, 0.82)");
    this.ctx.fillStyle = borderShadow;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    const boardWidth = this.grid.cols * this.cellSize;
    const boardHeight = this.grid.rows * this.cellSize;

    this.roundRect(this.ctx, 0, 0, boardWidth, boardHeight, this.cellSize * 0.88);
    this.ctx.clip();

    if (!this.groundTexture) {
      this.buildGroundTexture();
    }

    this.ctx.drawImage(this.groundTexture, 0, 0, boardWidth, boardHeight);

    const wetLight = this.ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
    wetLight.addColorStop(0, "rgba(255, 239, 170, 0.12)");
    wetLight.addColorStop(0.3, "rgba(255, 255, 255, 0.02)");
    wetLight.addColorStop(1, "rgba(0, 0, 0, 0.2)");
    this.ctx.fillStyle = wetLight;
    this.ctx.fillRect(0, 0, boardWidth, boardHeight);

    for (let i = 0; i < 5; i += 1) {
      const bandY = (Math.sin(timestamp / 1100 + i * 0.7) * 0.5 + 0.5) * boardHeight;
      const sheen = this.ctx.createLinearGradient(0, bandY - this.cellSize * 1.6, 0, bandY + this.cellSize * 1.6);
      sheen.addColorStop(0, "rgba(255,255,255,0)");
      sheen.addColorStop(0.5, "rgba(214, 224, 191, 0.035)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      this.ctx.fillStyle = sheen;
      this.ctx.fillRect(0, bandY - this.cellSize * 1.6, boardWidth, this.cellSize * 3.2);
    }

    for (let i = 0; i < 160; i += 1) {
      const x = (i * 71) % boardWidth;
      const y = (i * 47) % boardHeight;
      const sway = Math.sin(timestamp / 380 + i * 0.55) * this.cellSize * 0.08;
      this.ctx.strokeStyle = `rgba(190, 213, 144, ${0.045 + (i % 4) * 0.01})`;
      this.ctx.lineWidth = 0.9;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.quadraticCurveTo(x + sway * 0.4, y - this.cellSize * 0.18, x + sway, y - this.cellSize * 0.56);
      this.ctx.stroke();
    }

    const edgeDark = this.ctx.createRadialGradient(boardWidth * 0.5, boardHeight * 0.45, boardWidth * 0.18, boardWidth * 0.5, boardHeight * 0.5, boardWidth * 0.78);
    edgeDark.addColorStop(0, "rgba(0, 0, 0, 0)");
    edgeDark.addColorStop(1, "rgba(0, 0, 0, 0.22)");
    this.ctx.fillStyle = edgeDark;
    this.ctx.fillRect(0, 0, boardWidth, boardHeight);

    this.ctx.restore();
  }

  drawFrogFood(timestamp) {
    const center = this.cellCenter(this.food);
    const breath = 1 + Math.sin(timestamp / 300) * 0.02;
    const bodyScale = this.cellSize * 0.38 * breath;

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    this.ctx.fillStyle = "rgba(10, 12, 8, 0.24)";
    this.ctx.beginPath();
    this.ctx.ellipse(center.x + this.cellSize * 0.08, center.y + this.cellSize * 0.3, bodyScale * 1.15, bodyScale * 0.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    const bellyShadow = this.ctx.createRadialGradient(center.x, center.y + bodyScale * 0.15, bodyScale * 0.08, center.x, center.y, bodyScale * 1.2);
    bellyShadow.addColorStop(0, "#7b9652");
    bellyShadow.addColorStop(0.55, "#4d682b");
    bellyShadow.addColorStop(1, "#263414");
    this.ctx.fillStyle = bellyShadow;
    this.ctx.beginPath();
    this.ctx.ellipse(center.x, center.y + this.cellSize * 0.02, bodyScale, bodyScale * 0.8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#31441d";
    this.drawFrogLeg(center.x - bodyScale * 0.92, center.y + bodyScale * 0.3, -1);
    this.drawFrogLeg(center.x + bodyScale * 0.92, center.y + bodyScale * 0.3, 1);

    this.ctx.fillStyle = "#2e4318";
    this.ctx.beginPath();
    this.ctx.ellipse(center.x, center.y - bodyScale * 0.36, bodyScale * 0.84, bodyScale * 0.52, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#88a65c";
    this.ctx.beginPath();
    this.ctx.arc(center.x - bodyScale * 0.36, center.y - bodyScale * 0.54, bodyScale * 0.22, 0, Math.PI * 2);
    this.ctx.arc(center.x + bodyScale * 0.36, center.y - bodyScale * 0.54, bodyScale * 0.22, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#eef0c9";
    this.ctx.beginPath();
    this.ctx.arc(center.x - bodyScale * 0.36, center.y - bodyScale * 0.54, bodyScale * 0.1, 0, Math.PI * 2);
    this.ctx.arc(center.x + bodyScale * 0.36, center.y - bodyScale * 0.54, bodyScale * 0.1, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#0f1408";
    this.ctx.beginPath();
    this.ctx.arc(center.x - bodyScale * 0.36, center.y - bodyScale * 0.54, bodyScale * 0.05, 0, Math.PI * 2);
    this.ctx.arc(center.x + bodyScale * 0.36, center.y - bodyScale * 0.54, bodyScale * 0.05, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(227, 235, 198, 0.18)";
    this.ctx.beginPath();
    this.ctx.ellipse(center.x - bodyScale * 0.15, center.y - bodyScale * 0.18, bodyScale * 0.24, bodyScale * 0.11, -0.35, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawFrogLeg(x, y, direction) {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, this.cellSize * 0.12, this.cellSize * 0.2, direction * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(x + direction * this.cellSize * 0.12, y + this.cellSize * 0.14, this.cellSize * 0.08, this.cellSize * 0.16, direction * 1.1, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawSnake(progress, timestamp) {
    const bodyWidth = this.cellSize * 0.72;
    const pathPoints = this.getAnimatedSnakePath(progress, timestamp);
    if (pathPoints.length < 2) {
      return;
    }

    const measured = this.measurePath(pathPoints);
    const head = pathPoints[0];
    const neck = pathPoints[1];
    const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x);

    this.drawSnakeShadow(pathPoints, bodyWidth);

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);

    const bodyGradient = this.ctx.createLinearGradient(head.x, head.y, pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);
    bodyGradient.addColorStop(0, "#454822");
    bodyGradient.addColorStop(0.32, "#6f7440");
    bodyGradient.addColorStop(0.6, "#51572d");
    bodyGradient.addColorStop(1, "#242712");

    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "rgba(22, 18, 10, 0.65)";
    this.ctx.lineWidth = bodyWidth;
    this.drawSmoothStroke(pathPoints);

    this.ctx.strokeStyle = bodyGradient;
    this.ctx.lineWidth = bodyWidth * 0.84;
    this.drawSmoothStroke(pathPoints);

    this.drawSnakeScales(measured, bodyWidth);
    this.drawSnakeBelly(measured, bodyWidth);
    this.drawSnakeHead(head, headAngle, bodyWidth);
    this.drawSnakeTail(pathPoints[pathPoints.length - 1], pathPoints[pathPoints.length - 2], bodyWidth);
    this.ctx.restore();
  }

  drawSnakeShadow(points, bodyWidth) {
    this.ctx.save();
    this.ctx.translate(this.boardOffset.x + this.cellSize * 0.16, this.boardOffset.y + this.cellSize * 0.2);
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "rgba(11, 9, 6, 0.28)";
    this.ctx.lineWidth = bodyWidth * 1.05;
    this.drawSmoothStroke(points);
    this.ctx.restore();
  }

  drawSnakeScales(measured, bodyWidth) {
    const spacing = this.cellSize * 0.18;
    const start = bodyWidth * 0.9;
    const end = measured.totalLength - bodyWidth * 0.6;

    for (let distance = start; distance < end; distance += spacing) {
      const sample = this.samplePath(measured, distance);
      if (!sample) {
        continue;
      }

      const taper = 1 - distance / measured.totalLength;
      const scaleSize = Math.max(2.2, bodyWidth * 0.12 * (0.7 + taper * 0.6));
      const offsets = [-0.24, 0, 0.24];

      offsets.forEach((offset, index) => {
        const px = sample.x + sample.normal.x * bodyWidth * offset;
        const py = sample.y + sample.normal.y * bodyWidth * offset;
        this.ctx.fillStyle = index === 1 ? "rgba(198, 205, 138, 0.26)" : "rgba(43, 47, 22, 0.34)";
        this.ctx.beginPath();
        this.ctx.ellipse(px, py, scaleSize * (index === 1 ? 0.95 : 0.82), scaleSize * 0.68, sample.angle, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }
  }

  drawSnakeBelly(measured, bodyWidth) {
    const spacing = this.cellSize * 0.24;
    const start = bodyWidth * 1.1;
    const end = measured.totalLength - bodyWidth * 0.8;

    for (let distance = start; distance < end; distance += spacing) {
      const sample = this.samplePath(measured, distance);
      if (!sample) {
        continue;
      }

      const px = sample.x - sample.normal.x * bodyWidth * 0.14;
      const py = sample.y - sample.normal.y * bodyWidth * 0.14;
      this.ctx.fillStyle = "rgba(146, 138, 92, 0.28)";
      this.ctx.beginPath();
      this.ctx.ellipse(px, py, bodyWidth * 0.13, bodyWidth * 0.09, sample.angle, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawSnakeHead(head, angle, bodyWidth) {
    const gulp = this.swallowPulse;

    this.ctx.save();
    this.ctx.translate(head.x, head.y);
    this.ctx.rotate(angle);

    const headGradient = this.ctx.createRadialGradient(bodyWidth * 0.08, -bodyWidth * 0.12, bodyWidth * 0.08, 0, 0, bodyWidth * 0.9);
    headGradient.addColorStop(0, "#878c4d");
    headGradient.addColorStop(0.6, "#575c2c");
    headGradient.addColorStop(1, "#252713");
    this.ctx.fillStyle = headGradient;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, bodyWidth * 0.68, bodyWidth * 0.48, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (gulp > 0) {
      this.ctx.fillStyle = `rgba(188, 173, 106, ${0.12 + gulp * 0.16})`;
      this.ctx.beginPath();
      this.ctx.ellipse(-bodyWidth * 0.42, 0, bodyWidth * (0.26 + gulp * 0.08), bodyWidth * (0.16 + gulp * 0.05), 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = "rgba(223, 224, 174, 0.22)";
    this.ctx.beginPath();
    this.ctx.ellipse(-bodyWidth * 0.04, -bodyWidth * 0.12, bodyWidth * 0.26, bodyWidth * 0.11, -0.28, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "#11130b";
    this.ctx.beginPath();
    this.ctx.arc(bodyWidth * 0.18, -bodyWidth * 0.16, bodyWidth * 0.065, 0, Math.PI * 2);
    this.ctx.arc(bodyWidth * 0.18, bodyWidth * 0.16, bodyWidth * 0.065, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(249, 237, 167, 0.82)";
    this.ctx.beginPath();
    this.ctx.arc(bodyWidth * 0.18, -bodyWidth * 0.16, bodyWidth * 0.028, 0, Math.PI * 2);
    this.ctx.arc(bodyWidth * 0.18, bodyWidth * 0.16, bodyWidth * 0.028, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = "rgba(19, 15, 9, 0.42)";
    this.ctx.beginPath();
    this.ctx.arc(bodyWidth * 0.42, -bodyWidth * 0.08, bodyWidth * 0.03, 0, Math.PI * 2);
    this.ctx.arc(bodyWidth * 0.42, bodyWidth * 0.08, bodyWidth * 0.03, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawSnakeTail(tail, beforeTail, bodyWidth) {
    const angle = Math.atan2(tail.y - beforeTail.y, tail.x - beforeTail.x);

    this.ctx.save();
    this.ctx.translate(this.boardOffset.x, this.boardOffset.y);
    this.ctx.fillStyle = "#232411";
    this.ctx.beginPath();
    this.ctx.ellipse(tail.x, tail.y, bodyWidth * 0.22, bodyWidth * 0.14, angle, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  getAnimatedSnakePath(progress, timestamp) {
    const points = this.getInterpolatedSnake(progress).map((segment) => this.cellCenter(segment));
    const pathPoints = this.buildSmoothPathPoints(points);

    return pathPoints.map((point, index) => {
      if (index === 0 || index === pathPoints.length - 1) {
        return point;
      }

      const previous = pathPoints[index - 1];
      const next = pathPoints[index + 1];
      const tangent = this.normalize({ x: next.x - previous.x, y: next.y - previous.y });
      const normal = { x: -tangent.y, y: tangent.x };
      const fade = 1 - index / (pathPoints.length - 1);
      const sway = Math.sin(timestamp / 120 + index * 0.72) * this.cellSize * 0.07 * fade;

      return {
        x: point.x + normal.x * sway,
        y: point.y + normal.y * sway
      };
    });
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

  drawAtmosphere(width, height, timestamp) {
    const vignette = this.ctx.createRadialGradient(width * 0.48, height * 0.38, width * 0.18, width * 0.5, height * 0.48, width * 0.72);
    vignette.addColorStop(0, "rgba(255, 246, 212, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.34)");
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 4; i += 1) {
      const bandY = height * (0.15 + i * 0.18) + Math.sin(timestamp / 900 + i) * 6;
      const mist = this.ctx.createLinearGradient(0, bandY - 30, 0, bandY + 30);
      mist.addColorStop(0, "rgba(0, 0, 0, 0)");
      mist.addColorStop(0.5, "rgba(219, 223, 205, 0.028)");
      mist.addColorStop(1, "rgba(0, 0, 0, 0)");
      this.ctx.fillStyle = mist;
      this.ctx.fillRect(0, bandY - 30, width, 60);
    }
  }

  measurePath(points) {
    const segments = [];
    let totalLength = 0;

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      segments.push({ start, end, length, cumulative: totalLength });
      totalLength += length;
    }

    return { points, segments, totalLength };
  }

  samplePath(measured, distance) {
    const clamped = Math.max(0, Math.min(distance, measured.totalLength));

    for (const segment of measured.segments) {
      if (clamped <= segment.cumulative + segment.length || segment === measured.segments[measured.segments.length - 1]) {
        const local = segment.length === 0 ? 0 : (clamped - segment.cumulative) / segment.length;
        const tangent = this.normalize({
          x: segment.end.x - segment.start.x,
          y: segment.end.y - segment.start.y
        });
        return {
          x: segment.start.x + (segment.end.x - segment.start.x) * local,
          y: segment.start.y + (segment.end.y - segment.start.y) * local,
          tangent,
          normal: { x: -tangent.y, y: tangent.x },
          angle: Math.atan2(tangent.y, tangent.x)
        };
      }
    }

    return null;
  }

  normalize(vector) {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return { x: vector.x / length, y: vector.y / length };
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
