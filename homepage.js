let grid = []; // array of Cell objects
let history = []
let cols = 4;
let rows = 4;
let mode = "solid"; // current tool mode
let cellSize;
let activeButton = null;
let cnv;
let cnv2;
let solidButtonClicked = false; // Track if solid button is clicked
let selectedColor = "#000000";

let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;


function setup() {
  cnv = createCanvas(750, 750);
  cnv.center('horizontal');
  cnv.style('margin-top', '6%');
  stroke(0);
  strokeWeight(1);
  cellSize = width / cols;
  initGrid(cols, rows);
  cnv.style('border', '1px solid black');

  // Button events
  setupButton("#b1", "divide");
  setupButton("#b2", "solid");
  setupButton("#b3", "checker");
  setupButton("#b4", "circle");
  setupButton("#b5", "invert");

  select("#b1").mousePressed(() => mode = "divide");
  select("#b2").mousePressed(() => {
    mode = "solid";
    solidButtonClicked = !solidButtonClicked;  // Toggle the solid button state
    updateCursor();
  });
  select("#b3").mousePressed(() => mode = "checker");
  select("#b4").mousePressed(() => mode = "circle");
  select("#b5").mousePressed(() => mode = "invert");
  select("#reset").mousePressed(resetGrid);
  select("#colorPicker").input(() => {
  selectedColor = select("#colorPicker").value();
  });
}



function resetGrid() {
  cols = 4;
  rows = 4;
  cellSize = width / cols;
  initGrid(cols, rows);
}

function setupButton(selector, newMode) {
  const button = select(selector);
  button.mousePressed(() => {
    mode = newMode;

    // Remove active style from previous button
    if (activeButton) {
      activeButton.removeClass('active');
    }

    // Set this button as active
    button.addClass('active');
    activeButton = button;
  });
  
}

function centerCanvas() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 4;
  cnv.position(x, y);
}

function initGrid(cols, rows, x = 0, y = 0, size = width) {
  grid = [];
  let cellW = size / cols;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid.push(new Cell(x + i * cellW, y + j * cellW, cellW));
    }
  }
}

function draw() {
  background(240);
  for (let cell of grid) {
    cell.display();
  }
  if (isSelecting && selectionStart && selectionEnd) {
    noFill();
    stroke(0, 100, 255);
    strokeWeight(1);
    rectMode(CORNERS);
    rect(selectionStart.x, selectionStart.y, selectionEnd.x, selectionEnd.y);
    rectMode(CORNER);
  }
}

function mousePressed() {
  if (mode === "divide") {
    isSelecting = true;
    selectionStart = createVector(mouseX, mouseY);
    selectionEnd = selectionStart.copy();
  } else {
    for (let i = grid.length - 1; i >= 0; i--) {
      let cell = grid[i];
      if (cell.contains(mouseX, mouseY)) {
        history.push({ type: "mode", cell: cell, prevMode: cell.mode, prevColor: cell.color });
        cell.mode = mode;
        cell.update();
        break;
      }
    }
  }
}

function mouseDragged() {
  if (isSelecting) {
    selectionEnd = createVector(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (isSelecting) {
    let x1 = min(selectionStart.x, selectionEnd.x);
    let y1 = min(selectionStart.y, selectionEnd.y);
    let x2 = max(selectionStart.x, selectionEnd.x);
    let y2 = max(selectionStart.y, selectionEnd.y);

    // Only divide cells that are inside the selection
    for (let i = grid.length - 1; i >= 0; i--) {
      let cell = grid[i];
      if (!cell.divided && rectIntersect(x1, y1, x2 - x1, y2 - y1, cell.x, cell.y, cell.size, cell.size)) {
        let newCells = cell.divide();
        grid.splice(i, 1, ...newCells);
        history.push({ type: "divide", index: i, original: cell });
      }
    }
  }

  isSelecting = false;
  selectionStart = null;
  selectionEnd = null;
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x2 > x1 + w1 || x2 + w2 < x1 || y2 > y1 + h1 || y2 + h2 < y1);
}

function keyPressed() {
  if (key === 'z' || key === 'Z') {
    reverseAction();
  }
}


function reverseAction() {
  if (history.length === 0) return;
  let action = history.pop();
  if (action.type === "divide") {
    grid.splice(action.index, 4, action.original);
  } else if (action.type === "mode") {
    action.cell.mode = action.prevMode;
    action.cell.color = action.prevColor;
  }
}

class Cell {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.mode = null;
    this.previousMode = null;
    this.divided = false;
    this.color = 255;
    this.previousColor = 255;
  }

  contains(mx, my) {
    return mx >= this.x && mx < this.x + this.size && my >= this.y && my < this.y + this.size;
  }

  divide() {
    this.divided = true;
    let newCells = [];
    let newSize = this.size / 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        newCells.push(new Cell(this.x + i * newSize, this.y + j * newSize, newSize));
      }
    }
    return newCells;
  }

  update() {
    if (this.mode === "solid") {
      this.color = selectedColor;
    if (this.mode === "invert") {
      this.color = this.color === "#000000" ? "#ffffff" : "#000000";
  }
  }
}
  display() {
    if (this.mode === "solid" || this.mode === "invert") {
      stroke(0);
      strokeWeight(1);
      fill(this.color);
      rect(this.x, this.y, this.size, this.size);
    } else if (this.mode === "checker") {
      stroke(0);
      strokeWeight(1);
      let s = this.size / 2;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          fill((i + j) % 2 === 0 ? 0 : 255);
          rect(this.x + i * s, this.y + j * s, s, s);
        }
      }
    } else if (this.mode === "circle") {
      stroke(0);
      strokeWeight(1);
      fill(255);
      rect(this.x, this.y, this.size, this.size);
      fill(0);
      noStroke();
      ellipse(this.x + this.size / 2, this.y + this.size / 2, this.size, this.size);
    } else {
      stroke(0);
      strokeWeight(1);
      fill(255);
      rect(this.x, this.y, this.size, this.size);
    }
  }
}


const colorBox = document.getElementById("color-box");

let offsetX, offsetY, isDragging = false;

colorBox.addEventListener("mousedown", (e) => {
  
  isDragging = true;
  offsetX = e.clientX - colorBox.offsetLeft;
  offsetY = e.clientY - colorBox.offsetTop;
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    colorBox.style.left = (e.clientX - offsetX) + "px";
    colorBox.style.top = (e.clientY - offsetY) + "px";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});



const popup = document.createElement('div');
  popup.classList.add('popup-box');
  popup.textContent = "THE GENERATIVE GRID TOOL TAKES INSPIRATION FROM VINTAGE PIXEL ART WEBSITES, WITH ADDED FUNCTIONALITIES THAT ALLOW GRID DIVISION AND VARIOUS BUTTONS FOR : DRAWING, PATTERN MAKING, TYPOGRAPHY AND MEASUREMENT USE.";

  // Create the "Back" button inside the popup
  const backButton = document.createElement('div');
  backButton.classList.add('back');
  backButton.textContent = 'BACK';
  popup.appendChild(backButton);

  document.body.appendChild(popup);

  const nameDiv = document.querySelector('.name');

  nameDiv.addEventListener('click', function(event) {
    popup.style.display = 'block';
    event.stopPropagation(); // Prevent the document click from firing
  });

  // When the back button is clicked, hide the popup
  backButton.addEventListener('click', function() {
    popup.style.display = 'none';
  });