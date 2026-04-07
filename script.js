// =============================
// 🎮 CENA
// =============================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("game"),
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 10, 25);

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// =============================
// 🧱 GRID
// =============================

const COLS = 10;
const ROWS = 20;

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// =============================
// 🎯 ESTADO
// =============================

let currentPiece = null;
let gameOver = false;

// score
let score = 0;
let linesCleared = 0;
let speed = 30;

// =============================
// 🎨 CORES
// =============================

const COLORS = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502];

// =============================
// 🧩 FORMAS
// =============================

const SHAPES = [
  [[0,0],[1,0],[-1,0],[2,0]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[1,0],[-1,0],[0,1]],
  [[0,0],[1,0],[-1,0],[-1,1]]
];

// =============================
// 🧱 BLOCO
// =============================

function createBlock(x, y, color) {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color });

  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(x, y, 0);

  scene.add(cube);
  return cube;
}

// =============================
// 🧩 PEÇA
// =============================

function createPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  currentPiece = {
    x: Math.floor(COLS / 2),
    y: ROWS - 2,
    shape: JSON.parse(JSON.stringify(shape)),
    color,
    blocks: []
  };

  if (checkCollision(0, 0, currentPiece.shape)) {
    gameOver = true;
    showGameOver();
    return;
  }

  updatePieceMesh();
}

// =============================
// 🔄 VISUAL
// =============================

function updatePieceMesh() {
  currentPiece.blocks.forEach(b => scene.remove(b));
  currentPiece.blocks = [];

  currentPiece.shape.forEach(([dx, dy]) => {
    const x = currentPiece.x + dx;
    const y = currentPiece.y + dy;

    const block = createBlock(x - COLS/2, y - ROWS/2, currentPiece.color);
    currentPiece.blocks.push(block);
  });
}

// =============================
// 🚧 COLISÃO
// =============================

function checkCollision(offsetX, offsetY, shape = currentPiece.shape) {
  return shape.some(([dx, dy]) => {
    const x = currentPiece.x + dx + offsetX;
    const y = currentPiece.y + dy + offsetY;

    return (
      x < 0 ||
      x >= COLS ||
      y < 0 ||
      grid[y]?.[x]
    );
  });
}

// =============================
// 🔄 ROTAÇÃO
// =============================

function rotate() {
  const newShape = currentPiece.shape.map(([x, y]) => [-y, x]);

  if (!checkCollision(0, 0, newShape)) {
    currentPiece.shape = newShape;
    updatePieceMesh();
  }
}

// =============================
// 🧲 FIXAR
// =============================

function lockPiece() {
  currentPiece.shape.forEach(([dx, dy]) => {
    const x = currentPiece.x + dx;
    const y = currentPiece.y + dy;

    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      grid[y][x] = currentPiece.color;
    }
  });

  clearLines();
}

// =============================
// 🧹 LINHAS + SCORE
// =============================


function clearLines() {
  let fullLines = [];

  for (let y = 0; y < ROWS; y++) {
    if (grid[y].every(cell => cell !== 0)) {
      fullLines.push(y);
    }
  }

  if (fullLines.length === 0) return;

  // 🔥 Efeito visual (piscar)
  fullLines.forEach(y => {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) {
        const block = createBlock(
          x - COLS/2,
          y - ROWS/2,
          0xffffff // branco (flash)
        );

        setTimeout(() => scene.remove(block), 100);
      }
    }
  });

  // 💥 Remover linhas depois do efeito
  setTimeout(() => {
    fullLines.forEach(y => {
      grid.splice(y, 1);
      grid.push(Array(COLS).fill(0));
    });

    const lines = fullLines.length;

    // pontuação estilo Tetris
    const pointsTable = [0, 100, 300, 500, 800];
    const points = pointsTable[lines];

    score += points;
    linesCleared += lines;

    speed = Math.max(10, speed - 1);

    updateUI();
    renderGrid();

    // ✨ popup
    showScorePopup(points);

  }, 120);
}

// =============================
// 🧱 RENDER GRID
// =============================

let placedMeshes = [];

function renderGrid() {
  placedMeshes.forEach(m => scene.remove(m));
  placedMeshes = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) {
        const block = createBlock(
          x - COLS/2,
          y - ROWS/2,
          grid[y][x]
        );
        placedMeshes.push(block);
      }
    }
  }
}

// =============================
// ⬇️ MOVIMENTO
// =============================

function moveDown() {
  if (gameOver) return;

  if (!checkCollision(0, -1)) {
    currentPiece.y--;
  } else {
    lockPiece();
    createPiece();
  }

  updatePieceMesh();
  renderGrid();
}

function moveLeft() {
  if (!checkCollision(-1, 0)) {
    currentPiece.x--;
    updatePieceMesh();
  }
}

function moveRight() {
  if (!checkCollision(1, 0)) {
    currentPiece.x++;
    updatePieceMesh();
  }
}

// =============================
// 🎮 CONTROLES
// =============================

document.addEventListener("keydown", (e) => {
  if (gameOver && e.key === "r") location.reload();

  if (gameOver) return;

  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowDown") moveDown();
  if (e.key === "ArrowUp") rotate();
});

// =============================
// 🧾 UI
// =============================

function updateUI() {
  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("lines").innerText = "Linhas: " + linesCleared;
}

// =============================
// 🔄 LOOP
// =============================

let dropCounter = 0;

function animate() {
  if (gameOver) return;

  requestAnimationFrame(animate);

  dropCounter++;

  if (dropCounter > speed) {
    moveDown();
    dropCounter = 0;
  }

  renderer.render(scene, camera);
}

// =============================
// 🛑 GAME OVER
// =============================

function showGameOver() {
  const div = document.createElement("div");

  div.innerText = "GAME OVER - Pressione R";
  div.style.position = "absolute";
  div.style.top = "50%";
  div.style.left = "50%";
  div.style.transform = "translate(-50%, -50%)";
  div.style.fontSize = "40px";
  div.style.color = "red";

  document.body.appendChild(div);
}

// =============================
// ▶️ START
// =============================

updateUI();
createPiece();
animate();
//versao final