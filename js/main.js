"use strict";

var gBoard;
var gIsFirstMove;
var gGameTimer = null;
var gHintMode = false;
var gHintUsed = false;
var gGame = {
  isOn: true,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  livesLeft: 3,
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
var gCurrLevel = gLevel[0];
//eventlisteners

document.addEventListener("contextmenu", (event) => event.preventDefault());

function onInit() {
  gGame.isOn = true;
  gBoard = buildBoard();
  renderBoard(gBoard);
  gIsFirstMove = true;
}

function buildBoard() {
  const board = [];
  for (var i = 0; i < gCurrLevel.SIZE; i++) {
    board[i] = [];
    for (var j = 0; j < gCurrLevel.SIZE; j++) {
      board[i][j] = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      };
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
      var cellContent = "";
      if (cell.isShown && !cell.isMine) {
        cellContent =
          cell.minesAroundCount !== 0 ? +cell.minesAroundCount : " ";
        className += " mines-around-" + +cell.minesAroundCount;
      }
      // TODO: handle the if's better
      var className = cell.isMine ? "mine " : "";
      var imgClass = !cell.isMarked ? "hide" : "";
      var imgSrc = cell.isMarked ? "img/flag.png" : "";

      if (cell.isMine && cell.isShown) {
        imgSrc = "img/mine.png";
        imgClass = " ";
      }
      if (cell.isMarked) {
        className += "marked ";
      }
      if (cell.isShown) {
        className += "shown ";
      }

      strHTML += `\t<td data-i="${i}" data-j="${j}"
                               class="cell ${className}"
                              onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(${i},${j})">${cellContent}
                              <img class="${imgClass}" src="${imgSrc}">
</td>\n`;
    }
    strHTML += `</tr>\n`;
  }
  const elCells = document.querySelector(".sweeper-cells");
  elCells.innerHTML = strHTML;
  updateScore();
}

//set on each cell how much mines it has as neighbors

function setMinesNegsOnBoard(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      board[i][j].minesAroundCount = getMinesNegsCount(board, i, j);
    }
  }
}

//neighbor loop
function getMinesNegsCount(board, rowIdx, colIdx) {
  var count = 0;

  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (i === rowIdx && j === colIdx) continue;
      if (j < 0 || j >= board[0].length) continue;
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

  if (!gGame.isOn) return;
  // if (gHintMode) {
  //   if (!cell.isShown) {
  //     useHint(gBoard, i, j);
  //     gHintUsed = true;
  //   }
  //   if (gHintUsed) {
  //     gHintMode = false;
  //   } else {
  if (cell.isMarked) return;

  if (gIsFirstMove) {
    addMinesExcludeFirstClick(gBoard, i, j);
    setMinesNegsOnBoard(gBoard);
    gIsFirstMove = false;
    startTimer();
    renderBoard(gBoard);
  }
  revealCell(elCell, i, j);
  updateCell(i, j);
}

function revealCell(elCell, i, j) {
  const cell = gBoard[i][j];

  if (cell.isMarked) return;
  if (cell.isMine) {
    if (gGame.livesLeft > 0) {
      //model
      gGame.livesLeft--;
      //dom
      mineIndication(elCell);
      updateScore();
    } else {
      setDefeat();
      return;
    }
  } else if (!cell.isShown && cell.minesAroundCount !== 0) {
    //model
    cell.isShown = true;
    gGame.shownCount++;

    //dom
    updateCell(i, j);
  } else if (!cell.isShown && cell.minesAroundCount === 0) {
    //model
    cell.isShown = true;
    gGame.shownCount++;

    //dom
    updateCell(i, j);
    expandShown(gBoard, i, j);
  }

  checkGameOver();

  return;
}

function onCellMarked(i, j) {
  const cell = gBoard[i][j];
  if (!gGame.isOn) return;
  if (cell.isShown) return;
  if (gIsFirstMove) {
    alert(`Can't mark before clicking on atleast 1 cell`);
    return;
  }
  var limitMark = gCurrLevel.MINES;

  if (cell.isMarked) {
    // model
    cell.isMarked = false;
    gGame.markedCount--;

    //dom
    updateCell(i, j);
    updateScore();
  } else if (gGame.markedCount >= limitMark) {
    alert(`Can't mark more than number of mines!`);
  } else if (!cell.isMarked) {
    //model
    cell.isMarked = true;
    gGame.markedCount++;

    //dom
    updateCell(i, j);
    updateScore();
  }

  checkGameOver();

  return;
}

function addMinesExcludeFirstClick(board, firstClickI, firstClickJ) {
  var rowLength = board.length;
  var colLength = board[0].length;
  var minesToPlant = gCurrLevel.MINES;
  while (minesToPlant > 0) {
    var i = Math.floor(Math.random() * rowLength);
    var j = Math.floor(Math.random() * colLength);
    if (i === firstClickI && j === firstClickJ) continue;
    if (!board[i][j].isMine) {
      board[i][j].isMine = true;
      minesToPlant--;
    }
  }
  updateScore();
}

function expandShown(board, rowIdx, colIdx) {
  if (gBoard[rowIdx][colIdx].minesAroundCount > 0) return;

  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (i === rowIdx && j === colIdx) continue;
      if (j < 0 || j >= board[0].length) continue;
      if (gBoard[i][j].isShown || gBoard[i][j].isMine || gBoard[i][j].isMarked)
        continue;
      //model
      gBoard[i][j].isShown = true;
      gGame.shownCount++;

      //dom
      updateCell(i, j);
      expandShown(board, i, j);
    }
  }
}
function checkGameOver() {
  if (
    gGame.markedCount === gCurrLevel.MINES &&
    gGame.shownCount + gCurrLevel.MINES === gCurrLevel.SIZE ** 2
  ) {
    setVictory();
    return;
  }
  return false;
}
function setVictory() {
  gGame.isOn = false;
  clearInterval(gGameTimer);
  const elSmileImg = document.querySelector(".smiliy");
  elSmileImg.src = "img/win_smiliy.jpeg";
  handleHighScore(gGame.secsPassed, getCurrentLevelIndex());
}

function setGameLevel(num) {
  if (gGameTimer) {
    clearInterval(gGameTimer);
    gGame.secsPassed = 0;
    gGame.livesLeft = 3;
    const elSmileImg = document.querySelector(".smiliy");
    elSmileImg.src = "img/normal_smilie.jpeg";
    updateTimeOnBoard();
  }
  gGame.markedCount = 0;
  gGame.shownCount = 0;
  gCurrLevel = gLevel[num];
  updateHighScore(num);
  onInit();
}

function restartGame() {
  setGameLevel(getCurrentLevelIndex());
}

function getCurrentLevelIndex() {
  for (var i = 0; i < gLevel.length; i++) {
    if (
      gLevel[i].SIZE === gCurrLevel.SIZE &&
      gLevel[i].MINES === gCurrLevel.MINES
    ) {
      return i;
    }
  }
  return -1;
}

function updateScore() {
  const livesLeft = document.querySelector(".lifeSpan");
  const mineSpan = document.querySelector(".minesCountSpan");
  // console.log("mineSpan", mineSpan);
  // console.log("livesLeft", livesLeft);

  mineSpan.innerText = +gCurrLevel.MINES - +gGame.markedCount;
  livesLeft.innerText = +gGame.livesLeft;
}
function startTimer() {
  gGame.secsPassed = 0;
  if (gGameTimer) {
    clearInterval(gGameTimer);
    updateTimeOnBoard();
  }
  gGameTimer = setInterval(function () {
    gGame.secsPassed++;
    updateTimeOnBoard();
  }, 1000);
}
function updateTimeOnBoard() {
  const elTimePassed = document.querySelector(".timeSpan");
  elTimePassed.innerText = gGame.secsPassed;
}

function setDefeat() {
  console.log("lost!");
  gGame.isOn = false;
  clearInterval(gGameTimer);
  const elSmileImg = document.querySelector(".smiliy");
  elSmileImg.src = "img/dead_smilie.jpg";
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].isMine && !gBoard[i][j].isShown) {
        //model
        gBoard[i][j].isShown = true;

        //dom
        updateCell(i, j);
      }
    }
  }
}

function mineIndication(elCell) {
  elCell.style.backgroundColor = "orange";
  setTimeout(function () {
    elCell.style.backgroundColor = "";
  }, 2000);
}
function updateCell(i, j) {
  var cell = gBoard[i][j];
  var elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);

  elCell.className = "cell";

  if (cell.isMine) elCell.classList.add("mine");
  if (cell.isMarked) elCell.classList.add("marked");
  if (cell.isShown) elCell.classList.add("shown");

  if (cell.isShown && !cell.isMine && cell.minesAroundCount !== 0) {
    elCell.classList.add("mines-around-" + cell.minesAroundCount);
  }

  var cellContent =
    cell.isShown && !cell.isMine && cell.minesAroundCount !== 0
      ? cell.minesAroundCount
      : "";
  var imgClass = cell.isMarked ? "" : "hide";
  var imgSrc = "img/flag.png";
  if (cell.isMine && cell.isShown) {
    imgSrc = "img/mine.png";
    imgClass = "";
  }

  elCell.innerHTML = `${cellContent}<img class="${imgClass}" src="${imgSrc}">`;
}

function toggleDarkLightMode() {
  let body = document.body;
  if (body.getAttribute("data-theme") === "dark") {
    body.setAttribute("data-theme", "light");
  } else {
    body.setAttribute("data-theme", "dark");
  }
}

function handleHighScore(newScore, difficulty) {
  const elHighScoreSpan = document.querySelector(".highScoreSpan");
  //parseInt to convert string(from localstorage) to number(int)
  var highScoreEasy = parseInt(localStorage.getItem("scoreEasy"));
  var highScoreMedium = parseInt(localStorage.getItem("scoreMed"));
  var highScoreHard = parseInt(localStorage.getItem("scoreHard"));
  switch (difficulty) {
    case 0:
      if (isNaN(highScoreEasy) || newScore < highScoreEasy) {
        localStorage.setItem("scoreEasy", newScore);
        highScoreEasy = newScore;
        elHighScoreSpan.innerText += `${highScoreEasy}`;
      }
      break;
    case 1:
      if (isNaN(highScoreMedium) || newScore < highScoreMedium) {
        localStorage.setItem("scoreMed", newScore);

        highScoreMedium = newScore;
        elHighScoreSpan.innerText += `${highScoreMedium}`;
      }
      break;
    case 2:
      if (isNaN(highScoreHard) || newScore < highScoreHard) {
        localStorage.setItem("scoreHard", newScore);
        highScoreHard = newScore;

        elHighScoreSpan.innerText += `${highScoreHard}`;
      }
      break;
    default:
      console.log("No such difficulty");
  }
}
function updateHighScore(difficulty) {
  var highScore;

  switch (difficulty) {
    case 0:
      highScore = localStorage.getItem("scoreEasy");
      break;
    case 1:
      highScore = localStorage.getItem("scoreMed");
      break;
    case 2:
      highScore = localStorage.getItem("scoreHard");
      break;
  }
  var spanHighScore = document.querySelector(".highScoreSpan");
  spanHighScore.textContent = highScore || "";
}
function activateHint(elBtn) {
  if (gIsFirstMove) {
    alert("You have to click at least 1 cell!");
    return;
  }
  var hintsNum = 0;
  if (!gHintMode && hintsNum < 3) {
    gHintMode = true;
    gHintUsed = false;
    elBtn.classList.add("hide");
    hintsNum++;
  } else {
    return;
  }
}

function useHint(board, rowIdx, colIdx) {
  if (board[rowIdx][colIdx].isShown) return;
  var revealedCells = [];

  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      // if (i === rowIdx && j === colIdx) continue;
      if (j < 0 || j >= board[0].length) continue;
      if (gBoard[i][j].isShown) continue;

      var currCell = board[i][j];
      //model
      currCell.isShown = true;
      //selecting for array
      var elCurrCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`);
      // //dom
      updateCell(i, j);
      revealedCells.push(elCurrCell);
    }
  }

  setTimeout(function () {
    var k = revealedCells.length;

    while (k--) {
      var currRevealedCell = revealedCells[k];
      var i = currRevealedCell.getAttribute("data-i");
      var j = currRevealedCell.getAttribute("data-j");
      gBoard[i][j].isShown = false;
      currRevealedCell.classList.remove("shown");
      updateCell(i, j);
    }
    revealedCells.length = 0;
  }, 1000);
}
