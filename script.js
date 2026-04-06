// =============================
// 🎮 CENA
// =============================

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("game")
});

renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 20;

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
scene.add(light);

// =============================
// 🧱 GRID
// =============================

const COLS = 10;
const ROWS = 20;

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// =============================
// 🎨 CORES
// =============================

const COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];

// =============================
// 🧩 FORMAS
// =============================

const SHAPES = [
  [[0,0],[1,0],[-1,0],[2,0]], // I
  [[0,0],[1,0],[0,1],[1,1]], // O
  [[0,0],[1,0],[-1,0],[0,1]], // T
  [[0,0],[1,0],[-1,0],[-1,1]] // L
];

// =============================
// 🎯 PEÇA
// =============================

let currentPiece = null;

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
// 🧩 CRIAR PEÇA
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

  updatePieceMesh();
}

// =============================
// 🔄 ATUALIZAR VISUAL
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
// 🧹 LIMPAR LINHAS
// =============================

function clearLines() {
  for (let y = 0; y < ROWS; y++) {
    if (grid[y].every(cell => cell !== 0)) {
      grid.splice(y, 1);
      grid.push(Array(COLS).fill(0));
    }
  }
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
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowDown") moveDown();
  if (e.key === "ArrowUp") rotate();
});

// =============================
// 🔄 LOOP
// =============================

let dropCounter = 0;

function animate() {
  requestAnimationFrame(animate);

  dropCounter++;

  if (dropCounter > 30) {
    moveDown();
    dropCounter = 0;
  }

  renderer.render(scene, camera);
}

// =============================
// ▶️ START
// =============================

createPiece();
animate();