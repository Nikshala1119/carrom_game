// Carrom Pool Game - Main Game Logic
class CarromGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());

        // Game state
        this.gameState = 'playing'; // 'playing', 'gameover'
        this.currentPlayer = 'player'; // 'player' or 'computer'
        this.playerScore = 0;
        this.computerScore = 0;
        this.playerColor = 'white';
        this.computerColor = 'black';
        this.queenPocketed = false;
        this.queenCovered = { player: false, computer: false };
        this.foul = false;

        // Physics constants
        this.friction = 0.98;
        this.restitution = 0.8;

        // Board dimensions
        this.boardSize = this.canvas.width * 0.9;
        this.boardX = (this.canvas.width - this.boardSize) / 2;
        this.boardY = (this.canvas.height - this.boardSize) / 2;

        // Pieces
        this.pieces = [];
        this.striker = null;
        this.initializePieces();

        // Input handling
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.aimLine = { x: 0, y: 0 };
        this.power = 75;

        this.setupEventListeners();
        this.gameLoop();
    }

    setupCanvas() {
        const container = document.getElementById('game-container');
        const maxWidth = Math.min(container.clientWidth - 30, 500);
        this.canvas.width = maxWidth;
        this.canvas.height = maxWidth;

        if (this.pieces && this.pieces.length > 0) {
            this.boardSize = this.canvas.width * 0.9;
            this.boardX = (this.canvas.width - this.boardSize) / 2;
            this.boardY = (this.canvas.height - this.boardSize) / 2;
            this.initializePieces();
        }
    }

    initializePieces() {
        this.pieces = [];
        const center = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        const radius = this.boardSize * 0.025;

        // Create pieces in diamond formation
        const spacing = radius * 2.2;

        // Center piece (Queen - Red)
        this.pieces.push(new Piece(center.x, center.y, radius, 'red', 'queen'));

        // Ring 1 - 4 pieces alternating
        const ring1Positions = [
            { x: 0, y: -spacing },
            { x: spacing, y: 0 },
            { x: 0, y: spacing },
            { x: -spacing, y: 0 }
        ];
        ring1Positions.forEach((pos, i) => {
            const color = i % 2 === 0 ? 'white' : 'black';
            this.pieces.push(new Piece(
                center.x + pos.x,
                center.y + pos.y,
                radius,
                color,
                color
            ));
        });

        // Ring 2 - 8 pieces
        const ring2Positions = [
            { x: 0, y: -spacing * 2 },
            { x: spacing, y: -spacing },
            { x: spacing * 2, y: 0 },
            { x: spacing, y: spacing },
            { x: 0, y: spacing * 2 },
            { x: -spacing, y: spacing },
            { x: -spacing * 2, y: 0 },
            { x: -spacing, y: -spacing }
        ];
        ring2Positions.forEach((pos, i) => {
            const color = i % 2 === 0 ? 'black' : 'white';
            this.pieces.push(new Piece(
                center.x + pos.x,
                center.y + pos.y,
                radius,
                color,
                color
            ));
        });

        // Ring 3 - 6 pieces
        const ring3Positions = [
            { x: 0, y: -spacing * 3 },
            { x: spacing * 2, y: -spacing },
            { x: spacing * 2, y: spacing },
            { x: 0, y: spacing * 3 },
            { x: -spacing * 2, y: spacing },
            { x: -spacing * 2, y: -spacing }
        ];
        ring3Positions.forEach((pos, i) => {
            const color = i % 2 === 0 ? 'white' : 'black';
            this.pieces.push(new Piece(
                center.x + pos.x,
                center.y + pos.y,
                radius,
                color,
                color
            ));
        });

        // Create striker
        this.striker = new Piece(
            center.x,
            this.boardY + this.boardSize - radius * 3,
            radius * 1.2,
            '#FFD700',
            'striker'
        );
        this.striker.isStriker = true;
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleEnd(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e);
        });

        // Power slider
        const powerSlider = document.getElementById('power-slider');
        const powerValue = document.getElementById('power-value');
        powerSlider.addEventListener('input', (e) => {
            this.power = parseInt(e.target.value);
            powerValue.textContent = this.power + '%';
        });

        // Buttons
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'flex';
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'none';
        });

        document.getElementById('close-help').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'none';
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('game-over-modal').style.display = 'none';
            this.resetGame();
        });

        // PWA Installation
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('install-btn').style.display = 'block';
        });

        document.getElementById('install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                document.getElementById('install-btn').style.display = 'none';
            }
        });
    }

    handleStart(e) {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'player') return;
        if (!this.allPiecesStopped()) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on striker
        const dx = x - this.striker.x;
        const dy = y - this.striker.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.striker.radius * 2) {
            this.isDragging = true;
            this.dragStart = { x, y };
        }
    }

    handleMove(e) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.aimLine = { x, y };
    }

    handleEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;

        const dx = this.dragStart.x - this.striker.x;
        const dy = this.dragStart.y - this.striker.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const angle = Math.atan2(dy, dx);
            const forceFactor = Math.min(distance / 100, 1) * (this.power / 50);
            const force = 30 * forceFactor;

            this.striker.vx = Math.cos(angle) * force;
            this.striker.vy = Math.sin(angle) * force;

            this.aimLine = { x: 0, y: 0 };

            // Wait for pieces to stop before switching turns
            setTimeout(() => this.checkTurnEnd(), 100);
        }
    }

    allPiecesStopped() {
        const threshold = 0.1;
        return this.pieces.every(p => !p.pocketed &&
            Math.abs(p.vx) < threshold && Math.abs(p.vy) < threshold) &&
            Math.abs(this.striker.vx) < threshold && Math.abs(this.striker.vy) < threshold;
    }

    checkTurnEnd() {
        if (!this.allPiecesStopped()) {
            setTimeout(() => this.checkTurnEnd(), 100);
            return;
        }

        // Check for fouls and scoring
        this.processTurn();
    }

    processTurn() {
        let scored = false;
        this.foul = false;

        // Check pocketed pieces
        const pocketedThisTurn = this.pieces.filter(p =>
            p.justPocketed && !p.processed
        );

        pocketedThisTurn.forEach(piece => {
            piece.processed = true;

            if (piece.type === 'queen') {
                this.queenPocketed = true;
                scored = true;
            } else if (piece.type === this.getPlayerColor(this.currentPlayer)) {
                if (this.currentPlayer === 'player') {
                    this.playerScore += 10;
                } else {
                    this.computerScore += 10;
                }
                scored = true;

                // Check if queen needs to be covered
                if (this.queenPocketed && !this.queenCovered[this.currentPlayer]) {
                    this.queenCovered[this.currentPlayer] = true;
                    if (this.currentPlayer === 'player') {
                        this.playerScore += 50;
                    } else {
                        this.computerScore += 50;
                    }
                }
            } else if (piece.type !== 'queen') {
                // Pocketed opponent's piece - foul
                this.foul = true;
            }
        });

        // Check if striker was pocketed - foul
        if (this.striker.pocketed) {
            this.foul = true;
            this.resetStriker();
        }

        // Update UI
        this.updateScore();

        // Check for game over
        if (this.checkGameOver()) {
            return;
        }

        // Switch turns if no score or foul
        if (!scored || this.foul) {
            this.switchTurn();
        } else {
            // Same player continues
            if (this.currentPlayer === 'computer') {
                setTimeout(() => this.computerMove(), 1000);
            }
        }
    }

    switchTurn() {
        if (this.foul) {
            document.getElementById('foul-text').style.display = 'block';
            setTimeout(() => {
                document.getElementById('foul-text').style.display = 'none';
            }, 2000);
        }

        this.currentPlayer = this.currentPlayer === 'player' ? 'computer' : 'player';
        this.updateTurnIndicator();

        this.resetStriker();

        if (this.currentPlayer === 'computer') {
            setTimeout(() => this.computerMove(), 1500);
        }
    }

    resetStriker() {
        const center = this.canvas.width / 2;
        const baseY = this.boardY + this.boardSize - this.striker.radius * 3;

        if (this.currentPlayer === 'player') {
            this.striker.x = center;
            this.striker.y = baseY;
        } else {
            this.striker.x = center;
            this.striker.y = this.boardY + this.striker.radius * 3;
        }

        this.striker.vx = 0;
        this.striker.vy = 0;
        this.striker.pocketed = false;
    }

    getPlayerColor(player) {
        return player === 'player' ? this.playerColor : this.computerColor;
    }

    computerMove() {
        if (this.currentPlayer !== 'computer') return;

        // Simple AI: Find closest piece of computer's color and aim at it
        const computerColor = this.getPlayerColor('computer');
        const targetPieces = this.pieces.filter(p =>
            !p.pocketed && p.type === computerColor
        );

        if (targetPieces.length === 0) {
            // Try to hit queen if available
            const queen = this.pieces.find(p => !p.pocketed && p.type === 'queen');
            if (queen) {
                targetPieces.push(queen);
            }
        }

        if (targetPieces.length === 0) {
            // No valid targets, aim at any piece
            const anyPiece = this.pieces.find(p => !p.pocketed);
            if (anyPiece) {
                targetPieces.push(anyPiece);
            }
        }

        if (targetPieces.length > 0) {
            // Find closest pocket
            const pockets = this.getPockets();
            let bestShot = null;
            let bestScore = -Infinity;

            targetPieces.forEach(target => {
                pockets.forEach(pocket => {
                    // Calculate angle to shoot target towards pocket
                    const dx = pocket.x - target.x;
                    const dy = pocket.y - target.y;
                    const distToPocket = Math.sqrt(dx * dx + dy * dy);

                    // Angle from striker to target
                    const strikerToTargetDx = target.x - this.striker.x;
                    const strikerToTargetDy = target.y - this.striker.y;
                    const distToTarget = Math.sqrt(
                        strikerToTargetDx * strikerToTargetDx +
                        strikerToTargetDy * strikerToTargetDy
                    );

                    // Score this shot (closer target and pocket = better)
                    const score = 1000 / distToTarget + 500 / distToPocket;

                    if (score > bestScore) {
                        bestScore = score;
                        bestShot = {
                            angle: Math.atan2(strikerToTargetDy, strikerToTargetDx),
                            power: 0.6 + Math.random() * 0.3
                        };
                    }
                });
            });

            if (bestShot) {
                const force = 30 * bestShot.power;
                this.striker.vx = Math.cos(bestShot.angle) * force;
                this.striker.vy = Math.sin(bestShot.angle) * force;

                setTimeout(() => this.checkTurnEnd(), 100);
            }
        }
    }

    getPockets() {
        const pocketRadius = this.boardSize * 0.04;
        const offset = pocketRadius * 0.7;

        return [
            { x: this.boardX + offset, y: this.boardY + offset },
            { x: this.boardX + this.boardSize - offset, y: this.boardY + offset },
            { x: this.boardX + offset, y: this.boardY + this.boardSize - offset },
            { x: this.boardX + this.boardSize - offset, y: this.boardY + this.boardSize - offset }
        ];
    }

    updateScore() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('computer-score').textContent = this.computerScore;
    }

    updateTurnIndicator() {
        const turnText = document.getElementById('turn-text');
        turnText.textContent = this.currentPlayer === 'player' ? 'Your Turn' : 'Computer Turn';
    }

    checkGameOver() {
        const playerPieces = this.pieces.filter(p =>
            !p.pocketed && p.type === this.playerColor
        ).length;

        const computerPieces = this.pieces.filter(p =>
            !p.pocketed && p.type === this.computerColor
        ).length;

        if (playerPieces === 0 || computerPieces === 0) {
            this.gameState = 'gameover';

            let winner;
            if (playerPieces === 0) {
                winner = 'You Win!';
            } else {
                winner = 'Computer Wins!';
            }

            document.getElementById('winner-text').textContent = winner;
            document.getElementById('final-score').textContent =
                `Final Score - You: ${this.playerScore} | Computer: ${this.computerScore}`;
            document.getElementById('game-over-modal').style.display = 'flex';

            return true;
        }

        return false;
    }

    resetGame() {
        this.gameState = 'playing';
        this.currentPlayer = 'player';
        this.playerScore = 0;
        this.computerScore = 0;
        this.queenPocketed = false;
        this.queenCovered = { player: false, computer: false };
        this.foul = false;

        this.initializePieces();
        this.updateScore();
        this.updateTurnIndicator();

        document.getElementById('power-slider').value = 75;
        document.getElementById('power-value').textContent = '75%';
        this.power = 75;
    }

    update() {
        // Update all pieces
        [...this.pieces, this.striker].forEach(piece => {
            if (piece.pocketed) return;

            // Apply velocity
            piece.x += piece.vx;
            piece.y += piece.vy;

            // Apply friction
            piece.vx *= this.friction;
            piece.vy *= this.friction;

            // Stop if moving very slowly
            if (Math.abs(piece.vx) < 0.01) piece.vx = 0;
            if (Math.abs(piece.vy) < 0.01) piece.vy = 0;

            // Board collision
            const minX = this.boardX + piece.radius;
            const maxX = this.boardX + this.boardSize - piece.radius;
            const minY = this.boardY + piece.radius;
            const maxY = this.boardY + this.boardSize - piece.radius;

            if (piece.x < minX) {
                piece.x = minX;
                piece.vx *= -this.restitution;
            }
            if (piece.x > maxX) {
                piece.x = maxX;
                piece.vx *= -this.restitution;
            }
            if (piece.y < minY) {
                piece.y = minY;
                piece.vy *= -this.restitution;
            }
            if (piece.y > maxY) {
                piece.y = maxY;
                piece.vy *= -this.restitution;
            }

            // Check pockets
            this.checkPockets(piece);
        });

        // Check collisions between pieces
        this.checkCollisions();
    }

    checkPockets(piece) {
        const pockets = this.getPockets();
        const pocketRadius = this.boardSize * 0.04;

        pockets.forEach(pocket => {
            const dx = piece.x - pocket.x;
            const dy = piece.y - pocket.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < pocketRadius) {
                piece.pocketed = true;
                piece.justPocketed = true;
                piece.vx = 0;
                piece.vy = 0;
            }
        });
    }

    checkCollisions() {
        const allPieces = [...this.pieces, this.striker].filter(p => !p.pocketed);

        for (let i = 0; i < allPieces.length; i++) {
            for (let j = i + 1; j < allPieces.length; j++) {
                const p1 = allPieces[i];
                const p2 = allPieces[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = p1.radius + p2.radius;

                if (distance < minDist) {
                    // Collision detected
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    // Rotate velocities
                    const vx1 = p1.vx * cos + p1.vy * sin;
                    const vy1 = p1.vy * cos - p1.vx * sin;
                    const vx2 = p2.vx * cos + p2.vy * sin;
                    const vy2 = p2.vy * cos - p2.vx * sin;

                    // Swap velocities (elastic collision)
                    const temp = vx1;
                    const newVx1 = vx2;
                    const newVx2 = temp;

                    // Rotate back
                    p1.vx = newVx1 * cos - vy1 * sin;
                    p1.vy = vy1 * cos + newVx1 * sin;
                    p2.vx = newVx2 * cos - vy2 * sin;
                    p2.vy = vy2 * cos + newVx2 * sin;

                    // Separate pieces
                    const overlap = minDist - distance;
                    const separateX = (overlap / 2) * cos;
                    const separateY = (overlap / 2) * sin;

                    p1.x -= separateX;
                    p1.y -= separateY;
                    p2.x += separateX;
                    p2.y += separateY;
                }
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        this.drawBoard();

        // Draw pockets
        this.drawPockets();

        // Draw pieces
        this.pieces.forEach(piece => {
            if (!piece.pocketed) {
                piece.draw(this.ctx);
            }
        });

        // Draw striker
        if (!this.striker.pocketed) {
            this.striker.draw(this.ctx);
        }

        // Draw aim line
        if (this.isDragging && this.aimLine.x !== 0) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.striker.x, this.striker.y);

            const dx = this.striker.x - this.aimLine.x;
            const dy = this.striker.y - this.aimLine.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const maxLength = 200;
            const displayLength = Math.min(length, maxLength);

            const angle = Math.atan2(dy, dx);
            const endX = this.striker.x + Math.cos(angle) * displayLength;
            const endY = this.striker.y + Math.sin(angle) * displayLength;

            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawBoard() {
        // Playing area
        this.ctx.fillStyle = '#F5DEB3';
        this.ctx.fillRect(this.boardX, this.boardY, this.boardSize, this.boardSize);

        // Center circle
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.boardSize * 0.15,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();

        // Diagonal lines
        this.ctx.beginPath();
        this.ctx.moveTo(this.boardX, this.boardY);
        this.ctx.lineTo(this.boardX + this.boardSize, this.boardY + this.boardSize);
        this.ctx.moveTo(this.boardX + this.boardSize, this.boardY);
        this.ctx.lineTo(this.boardX, this.boardY + this.boardSize);
        this.ctx.stroke();

        // Border
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(this.boardX, this.boardY, this.boardSize, this.boardSize);
    }

    drawPockets() {
        const pockets = this.getPockets();
        const pocketRadius = this.boardSize * 0.04;

        pockets.forEach(pocket => {
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

class Piece {
    constructor(x, y, radius, color, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.type = type; // 'white', 'black', 'queen', 'striker'
        this.vx = 0;
        this.vy = 0;
        this.pocketed = false;
        this.justPocketed = false;
        this.processed = false;
        this.isStriker = false;
    }

    draw(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Main piece
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = this.type === 'striker' ? '#DAA520' :
                          this.type === 'queen' ? '#8B0000' : '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight
        const gradient = ctx.createRadialGradient(
            this.x - this.radius / 3,
            this.y - this.radius / 3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new CarromGame();
});
