function Node(value) {
  this.value = Array.from(value);
  this.children = [];
  this.level = 0;
  this.parent = null;
  this.solution = false;
}

let decisionThree = null;
let pcSolutions = [];
let board = [];
let turn = 0; // 0 = Jugador 1, 1 = Jugador 2 (PC)
let gameOver = false;

function renderBoard() {
  const html = board.map((row, rowIndex) => {
    const cells = row.map((cell, colIndex) => {
      const filledClass = cell !== "" ? "filled" : "";
      return `<button class="cell ${filledClass}" data-row="${rowIndex}" data-col="${colIndex}">${cell}</button>`;
    });
    return `<div class="row">${cells.join("")}</div>`;
  });

  document.querySelector("#board").innerHTML = html.join("");
}

function startGame() {
  renderBoard();
  turn = Math.random() <= 0.5 ? 0 : 1;
  renderPlayer();

  if (turn === 0) {
    playerPlays();
  } else {
    setTimeout(PCPlaysV2, 600);
  }
}

function resetGame() {
  board = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
  turn = 0;
  gameOver = false;
  pcSolutions = [];
  decisionThree = null;
  const msg = document.querySelector("#message");
  if (msg) msg.textContent = "";
  startGame();
}

function endGame(result) {
  gameOver = true;
  renderPlayer();
  const msg = document.querySelector("#message");
  if (result === "pcwon") msg.textContent = "¡Ganó el Jugador 2 (PC)!";
  else if (result === "playerwon") msg.textContent = "¡Ganó el Jugador 1!";
  else msg.textContent = "Empate.";
}

function renderPlayer() {
  document.querySelector("#player").textContent = gameOver
    ? ""
    : `${turn === 0 ? "Turno: Jugador 1" : "Turno: Jugador 2 (PC)"}`;
}

function PCPlaysV2() {
  const copy = JSON.parse(JSON.stringify(board));
  const root = new Node(copy);
  processNode(root, true, 0);

  if (pcSolutions.length > 0) {
    let min = 100;
    for (let i = 0; i < pcSolutions.length; i++) {
      if (pcSolutions[i].level < min) {
        min = pcSolutions[i].level;
      }
    }
    pcSolutions = pcSolutions.filter((sol) => sol.level === min);
    const moveIndex = parseInt(Math.random() * (pcSolutions.length - 0) + 0);
    const move = getRoot(pcSolutions[moveIndex]);
    decisionThree = move;
    board = JSON.parse(JSON.stringify(move.value));
    pcSolutions = [];
    turn = 0;
    renderBoard();
    renderPlayer();
    const won = checkIfWinner();
    if (won === "none") {
      playerPlays();
    } else {
      endGame(won);
    }
  } else {
    // No hay jugada ganadora forzada: juega una casilla libre al azar
    // para que la partida siga hasta ganador o empate.
    const emptyCells = [];
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === "") emptyCells.push([i, j]);
      }
    }
    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[r][c] = "X";
    turn = 0;
    renderBoard();
    renderPlayer();
    const won = checkIfWinner();
    if (won === "none") {
      playerPlays();
    } else {
      endGame(won);
    }
  }
}

function processNode(root, nturn, level) {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (root.value[i][j] === "") {
        root.children.push(createChild(root, i, j, nturn, level));
      }
    }
  }
  //check if winner cpu
  for (let i = 0; i < root.children.length; i++) {
    if (checkIfPCWinner(root.children[i].value)) {
      pcSolutions.push(root.children[i]);
    }
  }

  //process next level
  for (let i = 0; i < root.children.length; i++) {
    const item = root.children[i];
    processNode(item, !nturn, level + 1);
  }
}

function createChild(node, i, j, nturn, level) {
  const copy = JSON.parse(JSON.stringify(node.value));

  if (!nturn) {
    copy[i][j] = "O";
  } else {
    copy[i][j] = "X";
  }
  const newNode = new Node(copy);
  newNode.turn = nturn;
  newNode.level = level + 1;
  newNode.parent = node;
  return newNode;
}

function playerPlays() {
  document.querySelectorAll(".cell").forEach((buttonCell) => {
    buttonCell.addEventListener("click", () => {
      const row = parseInt(buttonCell.dataset.row);
      const col = parseInt(buttonCell.dataset.col);

      if (gameOver || board[row][col] !== "") return;

      board[row][col] = "O";
      turn = 1;
      renderBoard();
      renderPlayer();
      const won = checkIfWinner();
      if (won === "none") {
        setTimeout(PCPlaysV2, 600);
      } else {
        endGame(won);
      }
    });
  });
}

const WINNING_LINES = [
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
];

function getWinningMark(matrix) {
  for (const line of WINNING_LINES) {
    const [[r1, c1], [r2, c2], [r3, c3]] = line;
    const value = matrix[r1][c1];
    if (value && value === matrix[r2][c2] && value === matrix[r3][c3]) {
      return value;
    }
  }
  return null;
}

function isBoardFull(matrix) {
  return matrix.every((row) => row.every((cell) => cell !== ""));
}

function checkIfWinner() {
  const mark = getWinningMark(board);
  if (mark === "X") return "pcwon";
  if (mark === "O") return "playerwon";
  if (isBoardFull(board)) return "draw";
  return "none";
}

function checkIfPCWinner(arr) {
  return getWinningMark(arr) === "X";
}

function checkIfPlayerCanWin(arr) {
  const PCWon = [
    arr[0][0] === "O" && arr[1][1] === "O",
    arr[2][0] === "O" && arr[1][1] === "O",
    arr[0][0] === "O" && arr[1][0] === "O",
    arr[0][1] === "O" && arr[1][1] === "O",
    arr[0][2] === "O" && arr[1][2] === "O",
    arr[0][0] === "O" && arr[0][1] === "O",
    arr[1][0] === "O" && arr[1][1] === "O",
    arr[2][0] === "O" && arr[2][1] === "O",
  ];
  return PCWon.includes(true);
}

function getRoot(node) {
  let n = node;
  while (n.parent.parent != null) {
    n = n.parent;
  }

  return n;
}

document.querySelector("#restart-btn").addEventListener("click", resetGame);
resetGame();