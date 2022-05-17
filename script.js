/**
 * Game status
 * 0 = Não iniciado
 * 1 = Iniciado
 * 2 = Ganho
 * 3 = Perdido
 */

let game;

document.addEventListener("DOMContentLoaded", () => {
  game = new Board();
});

class Board {
  constructor() {
    this.size = "22X13";
    this.difficulty = 2;
    this.defaultBombs = 20;
    this.gameStatus = 0;
    this.flagsCount = 0;
    this.tilesSafe = [];

    this.interval = "";
    this.seconds = 0;

    this.bombPositions = [];

    this.boardAttributes = { w: 0, h: 0, count: 0 };

    this.colors = [
      "#DB3236",
      "#4885ED",
      "#48E6F1",
      "#B648F2",
      "#ED44B5",
      "#F4840D",
      "#F4C20D",
      "#008744",
    ];

    this.createBoard();
  }

  bombs() {
    const [w, h] = this.size.split("X");
    let quantity = this.difficulty * this.defaultBombs;

    for (let index = 0; index < quantity; index++) {
      let x = Math.round(parseInt(w) * Math.random());
      let y = Math.round(parseInt(h) * Math.random());

      if (x === 0) x++;
      else if (y === 0) y++;

      const checkBombExist = this.bombPositions.find(
        (bomb) => bomb.x === x && bomb.y === y
      );

      if (checkBombExist) quantity++;
      else this.bombPositions.push({ x, y });
    }
  }

  gameOver() {
    this.gameStatus = 2;

    clearInterval(this.interval);

    this.bombPositions.forEach((bomb, index) => {
      const position = this.getTilePosition(bomb);

      const tile = document.getElementById(`tile${position}`);

      setTimeout(() => {
        const color = this.getBombColor();

        tile.style.background = color;

        tile.setAttribute("class", `active ${[...tile.classList].join(" ")}`);
      }, 250 * (index + Math.random() * 2));
    });
  }

  getBombColor() {
    const random = Math.random() * 7;

    return this.colors[Math.round(random)];
  }

  restart() {
    document.getElementById("content").innerHTML = "";

    this.gameStatus = 0;
    this.flagsCount = 0;
    this.tilesSafe = [];
    this.seconds = 0;

    this.bombPositions = [];

    this.boardAttributes = { w: 0, h: 0, count: 0 };

    if (this.interval !== "") clearInterval(this.interval);

    const timer = document.getElementById("time");

    timer.innerHTML = "000";

    this.createBoard();
  }

  startGame() {
    this.gameStatus = 1;

    this.interval = setInterval(() => {
      this.incrementCount();
    }, 1000);
  }

  incrementCount() {
    const timer = document.getElementById("time");
    this.seconds++;

    timer.innerHTML = "";

    const timerSeconds = document.createTextNode(
      String(this.seconds).padStart(3, "0")
    );

    timer.appendChild(timerSeconds);
  }

  createBoard() {
    this.flagsCount = this.difficulty * this.defaultBombs;

    const flags = document.getElementById("flags");
    const flagsText = document.createTextNode(this.flagsCount);
    flags.innerHTML = "";
    flags.appendChild(flagsText);

    let [w, h] = this.size.split("X");

    w = parseInt(w);
    h = parseInt(h);

    const total = w * h;

    this.boardAttributes = { w, h, count: total };

    const board = document.getElementById("content");

    let x = 0;
    let y = 0;
    let tr;

    for (let index = 0; index < total; index++) {
      if (x === 0) tr = board.insertRow();

      if (x !== w) {
        const td = tr.insertCell();

        const tile = document.createElement("button");
        tile.setAttribute("tabIndex", "-1");

        const text = document.createTextNode("0");
        tile.appendChild(text);

        tile.setAttribute(
          "onClick",
          `game.handleClick({x:${x + 1}, y:${y + 1}, position: ${index + 1}})`
        );
        tile.setAttribute(
          "oncontextmenu",
          `game.handleFlag(${index + 1});return false;`
        );
        tile.setAttribute("id", `tile${index + 1}`);

        if ((x + 1 + (y + 1)) % 2 === 0) {
          tile.setAttribute("class", "even");
        } else {
          tile.setAttribute("class", "odd");
        }

        td.appendChild(tile);

        x++;
      }

      if (x === w) {
        x = 0;
        y++;
      }
    }

    this.bombs();
  }

  handleFlag(position) {
    if (this.gameStatus === 0) this.startGame();
    if (this.gameStatus > 1) return;

    const tile = document.getElementById(`tile${position}`);

    if (!tile.hasAttribute("clicked")) {
      tile.setAttribute("class", `flag ${[...tile.classList].join(" ")}`);
      this.flagsCount--;

      const flags = document.getElementById("flags");
      const flagsText = document.createTextNode(this.flagsCount);
      flags.innerHTML = "";
      flags.appendChild(flagsText);
    }
  }

  addSafeTile(position) {
    const checkAreadyAdd = this.tilesSafe.find(
      (st) => st.position === position
    );

    if (!checkAreadyAdd) this.tilesSafe.push({ position });
  }

  handleClick({ x, y, position }) {
    if (this.gameStatus === 0) this.startGame();
    if (this.gameStatus > 1) return;

    this.addSafeTile(position);

    const tile = document.getElementById(`tile${position}`);

    const hasBomb = this.bombPositions.find(
      (bomb) => bomb.x === x && bomb.y === y
    );

    if (hasBomb) {
      this.gameOver();
      return;
    }

    const arroundTiles = this.getAroundTiles({ x, y, position });
    const arroundBombs = this.calcBombs(arroundTiles);

    if (arroundBombs === 0) {
      arroundTiles.forEach((t) => {
        tile.setAttribute("clicked", true);

        this.handleClick(t);
      });
    } else {
      if (!tile.hasAttribute("clicked")) {
        const text = document.createTextNode(arroundBombs);

        tile.removeChild(tile.firstChild);
        tile.appendChild(text);

        const color = this.getTileColor(arroundBombs);

        tile.style.color = color;
      }
    }

    if (tile.className === "odd") tile.style.backgroundColor = "#E5C29F";
    else tile.style.backgroundColor = "#D7B899";

    tile.setAttribute("clicked", true);

    this.checkVictory();
  }

  checkVictory() {
    if (
      this.tilesSafe.length + this.bombPositions.length ===
      this.boardAttributes.count
    ) {
      alert("WIIIN");
    }
  }

  calcBombs(arroundTiles) {
    let arroundBombs = 0;

    arroundTiles.forEach((t) => {
      const hasBomb = this.bombPositions.find(
        (bomb) => bomb.x === t.x && bomb.y === t.y
      );

      if (hasBomb) arroundBombs++;
    });

    return arroundBombs;
  }

  getAroundTiles(tile) {
    const { w, h } = this.boardAttributes;
    const arr = Array.from(Array(8).keys());

    let indexX = tile.x - 1;
    let indexY = tile.y - 1;

    const around = [];

    arr.forEach(() => {
      if (indexX === tile.x && indexY === tile.y) indexY++;

      if (indexX !== 0 && indexY !== 0) {
        if (indexX <= w && indexY <= h) {
          const position = this.getTilePosition({ x: indexX, y: indexY });
          const tempTile = document.getElementById(`tile${position}`);

          if (!tempTile.hasAttribute("clicked"))
            around.push({ x: indexX, y: indexY, position });
        }
      }

      if (indexY === tile.y + 1) {
        indexY = tile.y - 1;
        indexX++;

        return;
      }

      indexY++;
    });

    return around;
  }

  getTileColor(arroundBombs) {
    switch (arroundBombs) {
      case 1:
        return "#267ACF";
      case 2:
        return "#3A8F3D";
      case 3:
        return "#D32F2F";
      default:
        return "#7B1FA2";
    }
  }

  getTilePosition({ x, y }) {
    const { w } = this.boardAttributes;

    return w * (y - 1) + x;
  }
}
