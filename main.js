"use strict";

var gBoard;
var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
};
var gLevel = [
  {
    SIZE: 4,
    MINES: 2,
  },
  {
    SIZE: 8,
    MINES: 14,
  },
  {
    SIZE: 12,
    MINES: 36,
  },
];

function onInit() {
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  gBoard = buildBoard();
  // addMines(gBoard);
  renderBoard(gBoard);
}

function buildBoard() {
  const board = [];
  for (var i = 0; i < 4; i++) {
    board[i] = [];
    for (var j = 0; j < 4; j++) {
      board[i][j] = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      };
    }
  }
  //Manually setting mines - to delete
  board[0][0].isMine = true;
  board[2][2].isMine = true;
  //Manually setting marked - to delete
  board[0][1].isMarked = true;
  board[1][3].isMarked = true;

  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      board[i][j].minesAroundCount = setMinesNegsCount(board, i, j);
    }
  }
  return board;
}

function renderBoard(board) {
  var strHTML = "";
  for (var i = 0; i < board.length; i++) {
    strHTML += `<tr class="sweeper-row" >\n`;
    for (var j = 0; j < board[0].length; j++) {
      const cell = board[i][j];

      var className = cell.isMine ? "mine" : "";
      if (cell.isMarked) {
        className += " marked";
      }
      if (cell.isShown) {
        className += " shown";
      }

      strHTML += `\t<td data-i="${i}" data-j="${j}"
                               class="cell ${className}" 
                              onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this)" >${"&nbsp"}
                               <img>
                               </td>\n`;
    }
    strHTML += `</tr>\n`;
  }
  const elCells = document.querySelector(".sweeper-cells");
  elCells.innerHTML = strHTML;
}

function setMinesNegsCount(board, rowIdx, colIdx) {
  var count = 0;

  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (i === rowIdx && j === colIdx) continue;
      if (j < 0 || j >= board[0].length) continue;
      console.log("board[i][j]", board[i][j]);
      var currCell = board[i][j];
      if (currCell.isMine && !currCell.isMarked) {
        count++;
      }
    }
  }

  return count;
}
function onCellClicked(elCell, i, j) {
  const cell = gBoard[i][j];
  if (cell.isMarked) return;
  if (!cell.isShown && cell.minesAroundCount !== 0) {
    elCell.innerText = +cell.minesAroundCount;
    elCell.classList.add("shown");
    console.log("isShown");
    return;
    // renderBoard(gBoard)
  } else if (!cell.isShown && cell.minesAroundCount === 0 && !cell.isMine) {
    elCell.innerText = ` `;
    elCell.classList.add("revealed");
    console.log("isrevealed");
    return;
  } else if (cell.isMine) {
    console.log("Lost!");
    return;
  }
}

function renderCell(location, value) {
  // Select the elCell and set the value
  const elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
  elCell.innerHTML = value;
}

function onCellMarked(elCell) {
  //model
  console.log(elCell);

  elCell.isMarked = true;
  //dom
}

function addMines(board) {
  var rowLength = board.length - 1;
  var colLength = board[0].length - 1;
  var minesToPlant = 4;
  while (minesToPlant > 0) {
    var i = Math.floor(Math.random() * rowLength);
    var j = Math.floor(Math.random() * colLength);
    if (!board[i][j].isMine) {
      board[i][j].isMine = true;
      minesToPlant--;
    }
  }
}

//   for(var i = 0 ; i < board.length;i++){
//     for(var j = 0 ; j < board[0].length;i++){

//     }
//   }
// }
// var gLevel = [
//   {
//     SIZE: 4,
//     MINES: 2,
//   },
//   {
//     SIZE: 8,
//     MINES: 14,
//   },
//   {
//     SIZE: 12,
//     MINES: 36,
//   },
// ];
