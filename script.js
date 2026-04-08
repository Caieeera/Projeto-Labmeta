// =============================
// CENÁRIO DO JOG
// =============================
// Cria o espaço 3D onde o jogo vai acontecer

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);// fundo preto

// Configura a câmera para ver o campo de jogo em perspectiva
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Cria o desenho na tela
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("game"),
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 10, 25);

// Ilumina a cena para que os blocos fiquem visíveis e com volume
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// ======================
// CAMPO DE JOGO (GRID)
// =============================
// Define o tamanho do campo onde os blocos caem e se encaixam

const COLS = 10;  // largura: 10 colunas
const ROWS = 20;  // altura: 20 linhas

// Cria a matriz que controla quais posições têm blocos (0 = vazio, cores = ocupado)
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// =============================
// CONTROLE DO JOGO
// =============================
// Variáveis que rastreiam como está o jogo neste momento

let currentPiece = null;  // peça que está caindo no momento
let gameOver = false;      // avisa quando o jogo termina

// Contadores para acompanhar o desempenho
let score = 0;              // pontuação total
let linesCleared = 0;       // quantas linhas foram completadas
let speed = 30;             // velocidade de queda (quanto menor, mais rápido)

// =============================
// CORES DOS BLOCOS
// =============================
// Paleta de cores para deixar cada tipo de peça diferente

const COLORS = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502]; // vermelho, verde, azul, laranja

// =============================
// FORMATOS DAS PEÇAS
// =============================
// Define o formato de cada tipo de teçominó (aqueles blocos que caem)
// Cada forma é descrita pelas posições relativas dos blocos em relação ao centro

const SHAPES = [
   [[0,0],[1,0],[-1,0],[2,0]],   // peça retilínea
  [[0,0],[1,0],[0,1],[1,1]],    // bloquinho quadrado
  [[0,0],[1,0],[-1,0],[0,1]],   // peça com formato de T
  [[0,0],[1,0],[-1,0],[-1,1]]   // peça em forma de Z
];

// =============================
// CRIAR UM BLOCO INDIVIDUAL
// =============================
// Cria cada quadradinho que vê na tela

function createBlock(x, y, color) {
  // Define a forma (um cubo)
  const geometry = new THREE.BoxGeometry();
  // Define a cor e o brilho
  const material = new THREE.MeshStandardMaterial({ color });

  // Cria o bloco juntando forma + cor
  const cube = new THREE.Mesh(geometry, material);
  // Posiciona o bloco no espaço 3D
  cube.position.set(x, y, 0);

  // Adiciona na cena para aparecer na tela
  scene.add(cube);
  return cube;
}

// =============================
// CRIAR UMA PEÇA NOVA
// =============================
// Gera uma peça aleatória no topo do campo com uma cor aleatória

function createPiece() {
  // Escolhe um formato aleatório da lista de formas
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  // Escolhe uma cor aleatória da paleta
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  // Cria a peça com todas as informações
  currentPiece = {
    x: Math.floor(COLS / 2),  // começa no meio do campo
    y: ROWS - 2,              // começa no topo
    shape: JSON.parse(JSON.stringify(shape)),  // cria uma cópia da forma
    color,
    blocks: []  // lista para guardar os cubos visuais
  };

  // Se a peça bater em algo no topo, o jogo termina
  if (checkCollision(0, 0, currentPiece.shape)) {
    gameOver = true;
    showGameOver();
    return;
  }

  // Desenha a peça na tela
  updatePieceMesh();
}

// =============================
// ATUALIZAR A PEÇA NA TELA
// =============================
// Remove a peça antiga e desenha ela na nova posição

function updatePieceMesh() {
  // Remove os blocos antigos da tela para desenhar os novos
  currentPiece.blocks.forEach(b => scene.remove(b));
  currentPiece.blocks = [];

  // Desenha cada bloco da peça na posição correta
  currentPiece.shape.forEach(([dx, dy]) => {
      const x = currentPiece.x + dx;
    const y = currentPiece.y + dy;

    // Centraliza o campo na tela
    const block = createBlock(x - COLS/2, y - ROWS/2, currentPiece.color);
    currentPiece.blocks.push(block);
  });
}

// =============================
// DETECÇÃO DE COLISÃO
// =============================
// Verifica se a peça bate em algo (parede, chão ou outro bloco)

function checkCollision(offsetX, offsetY, shape = currentPiece.shape) {
  // Testa cada bloco da peça para ver se bate em algo
  return shape.some(([dx, dy]) => {
    const x = currentPiece.x + dx + offsetX;
    const y = currentPiece.y + dy + offsetY;

    // Verifica se saiu dos limites ou bateu em um bloco existente
    return (
        x < 0 ||              // saiu pela esquerda
          x >= COLS ||          // saiu pela direita
        y < 0 ||              // saiu por baixo
        grid[y]?.[x]          // bateu em outro bloco
    );
  });
}

// =============================
// GIRAR A PEÇA
// =============================
// Gira a peça 90 graus se não bater em nada

function rotate() {
  // Rotação: transforma (x,y) em (-y,x)
  const newShape = currentPiece.shape.map(([x, y]) => [-y, x]);

  // Se conseguir usar a forma girada sem colisão, aplica
  if (!checkCollision(0, 0, newShape)) {
    currentPiece.shape = newShape;
    updatePieceMesh();
  }
}

// =============================
// FIXAR A PEÇA
// =============================
// Quando a peça atinge o chão, ela fica presa no grid



function lockPiece() {
  // Registra cada bloco da peça no grid
  currentPiece.shape.forEach(([dx, dy]) => {
    const x = currentPiece.x + dx;
    const y = currentPiece.y + dy;

    // Garante que o bloco fica dentro dos limites antes de registrar
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      grid[y][x] = currentPiece.color;
    }
  });

  // Verifica se completou alguma linha
  clearLines();
}

// =============================
// LIMPAR LINHAS COMPLETAS
// =============================
// Quando uma linha fica cheia, ela desaparece e o jogador ganha pontos

function clearLines() {
  // Encontra todas as linhas que estão completamente preenchidas
  let fullLines = [];

  for (let y = 0; y < ROWS; y++) {
    if (grid[y].every(cell => cell !== 0)) {
      fullLines.push(y);
    }
  }

  // Se não tem linhas cheias, não faz nada
  if (fullLines.length === 0) return;

  // Efeito de piscadura antes de sumir (fica branco por um momento)
  fullLines.forEach(y => {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) {
        const block = createBlock(
          x - COLS/2,
          y - ROWS/2,
          0xffffff // branco para o flash
        );

        // Remove o bloco branco após um tempo curto
        setTimeout(() => scene.remove(block), 100);
      }
    }
  });

  // Depois do efeito, de fato remove as linhas
  setTimeout(() => {
    // Remove as linhas cheias
    fullLines.forEach(y => {
      grid.splice(y, 1);
      grid.push(Array(COLS).fill(0));  // adiciona uma linha vazia no topo
    });

    // Calcula quantas linhas foram limpas
    const lines = fullLines.length;

    // Pontuação seguindo o estilo de um Tetris clássico
    const pointsTable = [0, 100, 300, 500, 800];
    const points = pointsTable[lines];

    // Atualiza a pontuação total
    score += points;
    linesCleared += lines;

    // Aumenta a dificuldade (diminui o tempo entre quedas)
    speed = Math.max(10, speed - 1);




    // Atualiza o que aparece na tela
    updateUI();
    renderGrid();

    // Mostra uma mensagem com os pontos ganhos
    showScorePopup(points);

  }, 120);
}

// =============================
// DESENHAR TODOS OS BLOCOS FIXOS
// =============================
// Renderiza o grid: mostra todos os blocos que já caducaram no campo

let placedMeshes = [];  // lista para controlar os blocos já desenhados

function renderGrid() {
  // Remove todos os blocos antigos da tela para desenhar do zero
  placedMeshes.forEach(m => scene.remove(m));
  placedMeshes = [];

  // Percorre todo o grid e desenha os blocos que existem
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) {  // há um bloco aqui
        const block = createBlock(
            x - COLS/2,
          y - ROWS/2,
          grid[y][x]  // usa a cor guardada no grid
        );
            placedMeshes.push(block);
      }
    }
  }
}

// =============================
// MOVIMENTAR A PEÇA
// =============================
// Funções para mover a peça para baixo, esquerda e direita

function moveDown() {
  // Se o jogo terminou, para
  if (gameOver) return;

  // Tenta mover para baixo
  if (!checkCollision(0, -1)) {
    currentPiece.y--;  // desce a peça
  } else {
    // Se não consegue descer, a peça fica fixa
    lockPiece();
    // E uma peça nova aparece
    createPiece();
  }

  // Atualiza na tela
  updatePieceMesh();
  renderGrid();
}

function moveLeft() {
  // Tenta mover para a esquerda
  if (!checkCollision(-1, 0)) {
    currentPiece.x--;  // move para esquerda
        updatePieceMesh();
  }
}

function moveRight() {
  // Tenta mover para a direita
  if (!checkCollision(1, 0)) {
    currentPiece.x++;  // move para direita
    updatePieceMesh();
  }
}

// =============================
// CONTROLES DO TECLADO
// =============================
// Detecta as teclas pressionadas e executa os movimentos correspondentes

document.addEventListener("keydown", (e) => {
  // Se o jogo terminou, aperta R para recomeçar
  if (gameOver && e.key === "r") location.reload();

  // Se o jogo já terminou, ignora os outros controles
  if (gameOver) return;

  // Setas do teclado controlam a peça
  if (e.key === "ArrowLeft") moveLeft();    // seta para esquerda
  if (e.key === "ArrowRight") moveRight();  // seta para direita

  if (e.key === "ArrowDown") moveDown();    // seta para baixo
  if (e.key === "ArrowUp") rotate();        // seta para cima gira
});

// =============================
// INTERFACE COM USUÁRIO
// =============================
// Atualiza o placar e contador de linhas na tela

function updateUI() {
  document.getElementById("score").innerText = "Score: " + score;        // mostra a pontuação
  document.getElementById("lines").innerText = "Linhas: " + linesCleared;  // mostra linhas limpas
}

// =============================
// PEÇAS CAINDO (LOOP PRINCIPAL)
// =============================
// Executa continuamente para fazer a animação do jogo

let dropCounter = 0;  // contador para saber quando fazer a peça cair

function animate() {
  // Se o jogo terminou, para a animação
  if (gameOver) return;

  // Chama essa função de novo no próximo frame (suave na tela)
  requestAnimationFrame(animate);

  // Incrementa o contador
  dropCounter++;

  // Quando o contador atinge a velocidade, faz a peça cair um bloco
  if (dropCounter > speed) {
    moveDown();  // peça desce
    dropCounter = 0;  // reseta o contador
  }

  // Desenha tudo na tela
  renderer.render(scene, camera);
}

// =============================
// FIM DO JOGO
// =============================
// Mostra uma mensagem quando o jogo acaba

function showGameOver() {
  // Cria uma caixa de texto
  const div = document.createElement("div");

  // Escreve a mensagem
  div.innerText = "GAME OVER - Pressione R";
  // Estilo da mensagem (centralizada e em vermelho)
  div.style.position = "absolute";
  div.style.top = "50%";

  div.style.left = "50%";
  div.style.transform = "translate(-50%, -50%)";
  div.style.fontSize = "40px";
  div.style.color = "red";

  // Adiciona na página para aparecer
  document.body.appendChild(div);
}

// =============================
// INÍCIO DO JOGO
// =============================
// Executa tudo que é necessário para começar uma partida

// Mostra o placar inicial
updateUI();
// Cria a primeira peça

createPiece();
// Começa a animação do jogo
animate();