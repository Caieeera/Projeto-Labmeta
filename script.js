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
camera.position.z = 15;

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
scene.add(light);

// =============================
// 🧱 GRID (10x20)
// =============================

const COLS = 10;
const ROWS = 20;

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// =============================
// 🎯 PEÇA ATUAL
// =============================

let currentPiece = null;

// formato T
const T_SHAPE = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1]
];

// =============================
// 🧱 CRIAR BLOCO VISUAL
// =============================

function createBlock(x, y) {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

  const cube = new THREE.Mesh(geometry, material);

  cube.position.set(x, y, 0);
  scene.add(cube);

  return cube;
}

// =============================
// 🧩 CRIAR PEÇA
// =============================

function createPiece() {
  currentPiece = {
    x: Math.floor(COLS / 2),
    y: ROWS - 2,
    shape: T_SHAPE,
    blocks: []
  };

  updatePieceMesh();
}

// =============================
// 🔄 ATUALIZAR VISUAL DA PEÇA
// =============================

function updatePieceMesh() {
  // remove blocos antigos
  currentPiece.blocks.forEach(b => scene.remove(b));
  currentPiece.blocks = [];

  currentPiece.shape.forEach(([dx, dy]) => {
    const x = currentPiece.x + dx;
    const y = currentPiece.y + dy;

    const block = createBlock(x - COLS / 2, y - ROWS / 2);
    currentPiece.blocks.push(block);
  });
}

// =============================
// 🚧 COLISÃO COM GRID
// =============================

function checkCollision(offsetX, offsetY) {
  return currentPiece.shape.some(([dx, dy]) => {
    const x = currentPiece.x + dx + offsetX;
    const y = currentPiece.y + dy + offsetY;

    return (
      x < 0 ||
      x >= COLS ||
      y < 0 ||
      grid[y][x] === 1
    );
  });
}

// =============================
// 🧲 FIXAR PEÇA
// =============================

function lockPiece() {
  currentPiece.shape.forEach(([dx, dy]) => {
    const x = currentPiece.x + dx;
    const y = currentPiece.y + dy;

    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      grid[y][x] = 1;
    }
  });
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