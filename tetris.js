const canvas = document.getElementById('tetris-canvas');
const context = canvas.getContext('2d');
const canvasNext = document.getElementById('next-canvas');
context.scale(20, 20);

const context2 = canvasNext.getContext('2d');
context2.scale(35, 35);
var paused = false;
var dropInterval = 1000;

function draw() {

    //draw game box
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    drawMatrix(context, arena, {x: 0, y: 0}); // draw collection of fallen pieces
    drawMatrix(context, player.matrix, player.pos); // draw first piece (player)
    
    //draw next box 
    context2.fillStyle = 'black';
    context2.fillRect(0,0, canvasNext.width, canvasNext.height);
    drawMatrix(context2, next.matrix, {x:2,y:1});
            
}

function drawMatrix(context, matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

/* clear row when filled*/
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type)
{
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

/* add piece to arena */
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    if(!paused)player.pos.y++; 
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        checkScore();
    }
    dropCounter = 0;
}

function play() {
    document.getElementById("start-screen").style.display="none";
}

function howtoplay() {
    document.getElementById("start-screen").style.display="block";
}
// toggle paused boolean //p
function pause() {
    if(paused) {
        paused = false;
        document.getElementById("pause-screen").style.display="none";
    }
    else { 
        paused = true;
        document.getElementById("pause-screen").style.display="block";
    }  
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    
    if(next.matrix == null){
    	next.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    player.matrix = next.matrix;
    next.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
	

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

    //when game ends and restarts
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        player.level = 1;
        dropInterval = 1000;
        updateScore();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}


function checkScore() {
    if (player.score >= ((player.level * player.level)*10)) {
        player.level += 1;
        updateScore();
        updateSpeed();
    }

}

function updateSpeed(){
    dropInterval -= 100;
}

let dropCounter = 0;

let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('level').innerText = player.level;
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 65) { //left (a)
        playerMove(-1);
    } else if (event.keyCode === 68) { //right (d)
        playerMove(1);
    } else if (event.keyCode === 83) { //down (s)
        playerDrop();
    } else if (event.keyCode === 81) { //left rotate (q)
        playerRotate(-1);
    } else if (event.keyCode === 69) { //right rotate (e)
        playerRotate(1);
    } else if (event.keyCode === 80) { // (p)ause
        pause();
    }
});

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    level: 1,
};

const next = {
	pos: {x: 0, y: 0},
    matrix: null,
}

playerReset();
updateScore();
update();



   

