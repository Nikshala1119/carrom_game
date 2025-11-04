// Carrom Pool Game - Matching Real Carrom Pool Experience
class CarromGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());

        // Game state
        this.gameState = 'aiming'; // 'aiming', 'striker-placement', 'shooting', 'waiting', 'gameover'
        this.currentPlayer = 'player'; // 'player' or 'computer'
        this.playerScore = 0;
        this.computerScore = 0;
        this.playerColor = 'white';
        this.computerColor = 'black';
        this.queenPocketed = false;
        this.queenCovered = { player: false, computer: false };
        this.foul = false;
        this.validHit = false;

        // Physics constants
        this.friction = 0.97;
        this.restitution = 0.8;

        // Board dimensions
        this.boardSize = this.canvas.width * 0.9;
        this.boardX = (this.canvas.width - this.boardSize) / 2;
        this.boardY = (this.canvas.height - this.boardSize) / 2;

        // Pieces
        this.pieces = [];
        this.striker = null;
        this.initializePieces();

        // Aiming system (Carrom Pool style)
        this.aimAngle = -Math.PI / 2; // Start aiming upward
        this.power = 0;
        this.maxPower = 100;
        this.isDraggingPower = false;
        this.powerStartY = 0;
        this.isPlacingStriker = true;
        this.strikerBaselineY = null;

        // Visual effects
        this.particles = [];
        this.pocketAnimations = [];

        // Sound system
        this.sounds = {
            strike: this.createSound(300, 0.1),
            collision: this.createSound(200, 0.05),
            pocket: this.createSound(400, 0.2)
        };

        this.setupEventListeners();
        this.gameLoop();
    }

    createSound(frequency, duration) {
        // Simple sound effect using Web Audio API
        return () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            } catch (e) {
                // Silently fail if audio not supported
            }
        };
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
        const spacing = radius * 2.1;

        // Create 9 white, 9 black pieces, 1 queen in diamond formation
        // Center: Queen
        this.pieces.push(new Piece(center.x, center.y, radius, '#DC143C', 'queen'));

        // Ring 1 - 4 pieces
        const colors1 = ['white', 'black', 'white', 'black'];
        const ring1 = [
            { x: 0, y: -spacing },
            { x: spacing, y: 0 },
            { x: 0, y: spacing },
            { x: -spacing, y: 0 }
        ];
        ring1.forEach((pos, i) => {
            this.pieces.push(new Piece(
                center.x + pos.x,
                center.y + pos.y,
                radius,
                colors1[i],
                colors1[i]
            ));
        });

        // Ring 2 - 8 pieces
        const colors2 = ['black', 'white', 'black', 'white', 'black', 'white', 'black', 'white'];
        const ring2 = [
            { x: 0, y: -spacing * 2 },
            { x: spacing, y: -spacing },
            { x: spacing * 2, y: 0 },
            { x: spacing, y: spacing },
            { x: 0, y: spacing * 2 },
            { x: -spacing, y: spacing },
            { x: -spacing * 2, y: 0 },
            { x: -spacing, y: -spacing }
        ];
        ring2.forEach((pos, i) => {
            this.pieces.push(new Piece(
                center.x + pos.x,
                center.y + pos.y,
                radius,
                colors2[i],
                colors2[i]
            ));
        });

        // Ring 3 - 6 pieces
        const colors3 = ['white', 'black', 'white', 'black', 'white', 'black'];
        const ring3 = [
            { x: 0, y: -spacing * 3 },
            { x: spacing * 2, y: -spacing },
            { x: spacing * 2, y: spacing },
            { x: 0, y: spacing * 3 },
            { x: -spacing * 2, y: spacing },
            { x: -spacing * 2, y: -spacing }
        ];
        ring3.forEach((pos, i) => {
            this.pieces.push(new Piece(
                center.x + pos.x,
                center.y + pos.y,
                radius,
                colors3[i],
                colors3[i]
            ));
        });

        // Verify counts
        const whiteCount = this.pieces.filter(p => p.type === 'white').length;
        const blackCount = this.pieces.filter(p => p.type === 'black').length;
        console.log(`Pieces: ${whiteCount} white, ${blackCount} black, 1 queen`);

        // Create striker
        const baseY = this.currentPlayer === 'player'
            ? this.boardY + this.boardSize - radius * 3
            : this.boardY + radius * 3;

        this.strikerBaselineY = baseY;
        this.striker = new Piece(center.x, baseY, radius * 1.3, '#FFD700', 'striker');
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
        if (this.currentPlayer !== 'player') return;
        if (this.gameState === 'shooting' || this.gameState === 'waiting') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking near striker for placement or aiming
        const dx = x - this.striker.x;
        const dy = y - this.striker.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (this.isPlacingStriker && distance < this.striker.radius * 3) {
            this.gameState = 'striker-placement';
        } else if (!this.isPlacingStriker && this.gameState === 'aiming') {
            // Start power drag
            this.isDraggingPower = true;
            this.powerStartY = y;
            this.power = 0;
        }
    }

    handleMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.gameState === 'striker-placement') {
            // Move striker along baseline
            const minX = this.boardX + this.striker.radius * 2;
            const maxX = this.boardX + this.boardSize - this.striker.radius * 2;
            this.striker.x = Math.max(minX, Math.min(maxX, x));
        } else if (this.gameState === 'aiming' || this.isDraggingPower) {
            // Update aim angle
            const dx = x - this.striker.x;
            const dy = y - this.striker.y;
            this.aimAngle = Math.atan2(dy, dx);

            // Update power based on drag distance
            if (this.isDraggingPower) {
                const dragDistance = Math.abs(y - this.powerStartY);
                this.power = Math.min(dragDistance / 2, this.maxPower);
            }
        }
    }

    handleEnd(e) {
        if (this.gameState === 'striker-placement') {
            this.gameState = 'aiming';
            this.isPlacingStriker = false;
            return;
        }

        if (this.isDraggingPower && this.power > 10) {
            // Shoot!
            this.shoot();
        }

        this.isDraggingPower = false;
        this.power = 0;
    }

    shoot() {
        const force = (this.power / this.maxPower) * 40; // Max force 40
        this.striker.vx = Math.cos(this.aimAngle) * force;
        this.striker.vy = Math.sin(this.aimAngle) * force;

        this.gameState = 'shooting';
        this.validHit = false;

        // Play strike sound
        this.sounds.strike();

        // Add cue animation particles
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.striker.x,
                y: this.striker.y,
                vx: Math.cos(this.aimAngle) * -2 + (Math.random() - 0.5) * 2,
                vy: Math.sin(this.aimAngle) * -2 + (Math.random() - 0.5) * 2,
                life: 1,
                size: 3
            });
        }

        setTimeout(() => this.checkTurnEnd(), 200);
    }

    computerMove() {
        if (this.currentPlayer !== 'computer') return;

        this.gameState = 'waiting';

        setTimeout(() => {
            // AI: Find best shot
            const computerColor = this.getPlayerColor('computer');
            const targetPieces = this.pieces.filter(p => !p.pocketed && p.type === computerColor);

            if (targetPieces.length === 0) {
                const queen = this.pieces.find(p => !p.pocketed && p.type === 'queen');
                if (queen) targetPieces.push(queen);
            }

            if (targetPieces.length === 0) {
                const anyPiece = this.pieces.find(p => !p.pocketed);
                if (anyPiece) targetPieces.push(anyPiece);
            }

            if (targetPieces.length > 0) {
                // Place striker randomly on baseline
                const minX = this.boardX + this.striker.radius * 2;
                const maxX = this.boardX + this.boardSize - this.striker.radius * 2;
                this.striker.x = minX + Math.random() * (maxX - minX);

                // Aim at target with some randomness
                const target = targetPieces[Math.floor(Math.random() * targetPieces.length)];
                const dx = target.x - this.striker.x;
                const dy = target.y - this.striker.y;
                this.aimAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;

                // Shoot with random power
                const force = 25 + Math.random() * 15;
                this.striker.vx = Math.cos(this.aimAngle) * force;
                this.striker.vy = Math.sin(this.aimAngle) * force;

                this.gameState = 'shooting';
                this.validHit = false;
                this.sounds.strike();

                setTimeout(() => this.checkTurnEnd(), 200);
            }
        }, 1000);
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

        this.processTurn();
    }

    processTurn() {
        let scored = false;
        this.foul = false;

        // Check pocketed pieces
        const pocketedThisTurn = this.pieces.filter(p => p.justPocketed && !p.processed);

        console.log(`Processing turn for ${this.currentPlayer}, pocketed pieces:`, pocketedThisTurn.length);

        pocketedThisTurn.forEach(piece => {
            piece.processed = true;

            console.log(`Pocketed piece type: ${piece.type}, current player: ${this.currentPlayer}, player color: ${this.getPlayerColor(this.currentPlayer)}`);

            if (piece.type === 'queen') {
                this.queenPocketed = true;
                scored = true;
                console.log('Queen pocketed!');
            } else if (piece.type === this.getPlayerColor(this.currentPlayer)) {
                if (this.currentPlayer === 'player') {
                    this.playerScore += 10;
                    console.log(`Player scored! New score: ${this.playerScore}`);
                } else {
                    this.computerScore += 10;
                    console.log(`Computer scored! New score: ${this.computerScore}`);
                }
                scored = true;
                this.validHit = true;

                // Check if queen needs to be covered
                if (this.queenPocketed && !this.queenCovered[this.currentPlayer]) {
                    this.queenCovered[this.currentPlayer] = true;
                    if (this.currentPlayer === 'player') {
                        this.playerScore += 50;
                    } else {
                        this.computerScore += 50;
                    }
                    console.log('Queen covered! Bonus points awarded');
                }
            } else if (piece.type !== 'queen') {
                // Pocketed opponent's piece - foul
                this.foul = true;
                console.log('Foul! Pocketed opponent piece');
            }
        });

        // Check if striker was pocketed - foul
        if (this.striker.pocketed) {
            this.foul = true;
            console.log('Foul! Striker pocketed');
            this.resetStriker();
        }

        // Update UI
        console.log(`Updating scores - Player: ${this.playerScore}, Computer: ${this.computerScore}`);
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
            this.resetForNextShot();
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
        this.resetForNextShot();

        if (this.currentPlayer === 'computer') {
            setTimeout(() => this.computerMove(), 1500);
        }
    }

    resetForNextShot() {
        this.resetStriker();
        this.gameState = 'aiming';
        this.isPlacingStriker = true;
        this.power = 0;
        this.aimAngle = this.currentPlayer === 'player' ? -Math.PI / 2 : Math.PI / 2;
    }

    resetStriker() {
        const center = this.canvas.width / 2;
        const radius = this.boardSize * 0.025 * 1.3;

        if (this.currentPlayer === 'player') {
            this.strikerBaselineY = this.boardY + this.boardSize - radius * 2.5;
            this.striker.y = this.strikerBaselineY;
        } else {
            this.strikerBaselineY = this.boardY + radius * 2.5;
            this.striker.y = this.strikerBaselineY;
        }

        this.striker.x = center;
        this.striker.vx = 0;
        this.striker.vy = 0;
        this.striker.pocketed = false;
    }

    getPlayerColor(player) {
        return player === 'player' ? this.playerColor : this.computerColor;
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
        const playerPieces = this.pieces.filter(p => !p.pocketed && p.type === this.playerColor).length;
        const computerPieces = this.pieces.filter(p => !p.pocketed && p.type === this.computerColor).length;

        if (playerPieces === 0 || computerPieces === 0) {
            this.gameState = 'gameover';

            let winner;
            if (playerPieces === 0) {
                winner = 'You Win! 🎉';
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
        this.gameState = 'aiming';
        this.currentPlayer = 'player';
        this.playerScore = 0;
        this.computerScore = 0;
        this.queenPocketed = false;
        this.queenCovered = { player: false, computer: false };
        this.foul = false;
        this.isPlacingStriker = true;
        this.power = 0;
        this.aimAngle = -Math.PI / 2;
        this.particles = [];
        this.pocketAnimations = [];

        this.initializePieces();
        this.updateScore();
        this.updateTurnIndicator();
    }

    update() {
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });

        // Update pocket animations
        this.pocketAnimations = this.pocketAnimations.filter(a => {
            a.scale += 0.05;
            a.opacity -= 0.05;
            return a.opacity > 0;
        });

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

                // Play pocket sound
                this.sounds.pocket();

                // Add pocket animation
                this.pocketAnimations.push({
                    x: pocket.x,
                    y: pocket.y,
                    scale: 1,
                    opacity: 1,
                    color: piece.color
                });
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

                    // Play collision sound
                    if (Math.abs(vx1) > 1 || Math.abs(vy1) > 1) {
                        this.sounds.collision();
                    }

                    // Add collision particles
                    for (let k = 0; k < 3; k++) {
                        this.particles.push({
                            x: (p1.x + p2.x) / 2,
                            y: (p1.y + p2.y) / 2,
                            vx: (Math.random() - 0.5) * 3,
                            vy: (Math.random() - 0.5) * 3,
                            life: 0.5,
                            size: 2
                        });
                    }

                    // Track if striker hit a piece
                    if (p1.isStriker || p2.isStriker) {
                        this.validHit = true;
                    }
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

        // Draw aiming guide (Carrom Pool style)
        if ((this.gameState === 'aiming' || this.gameState === 'striker-placement') && this.currentPlayer === 'player') {
            this.drawAimingGuide();
        }

        // Draw power indicator
        if (this.isDraggingPower) {
            this.drawPowerIndicator();
        }

        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw pocket animations
        this.pocketAnimations.forEach(a => {
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${a.opacity})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, this.boardSize * 0.04 * a.scale, 0, Math.PI * 2);
            this.ctx.stroke();
        });

        // Draw instruction text
        if (this.currentPlayer === 'player' && this.gameState !== 'shooting' && this.gameState !== 'waiting') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = `${this.canvas.width * 0.04}px Arial`;
            this.ctx.textAlign = 'center';

            if (this.isPlacingStriker) {
                this.ctx.fillText('Drag striker to position', this.canvas.width / 2, this.canvas.height * 0.95);
            } else {
                this.ctx.fillText('Drag to aim and shoot', this.canvas.width / 2, this.canvas.height * 0.95);
            }
        }
    }

    drawAimingGuide() {
        const guideLength = this.boardSize * 0.6;

        // Draw cue stick
        this.ctx.save();
        this.ctx.translate(this.striker.x, this.striker.y);
        this.ctx.rotate(this.aimAngle);

        // Cue stick
        const cueOffset = this.striker.radius * 2;
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-cueOffset - guideLength * 0.4, -3, guideLength * 0.4, 6);

        // Cue tip
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(-cueOffset - guideLength * 0.4, -5, 20, 10);

        this.ctx.restore();

        // Draw trajectory line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.striker.x, this.striker.y);

        const endX = this.striker.x + Math.cos(this.aimAngle) * guideLength;
        const endY = this.striker.y + Math.sin(this.aimAngle) * guideLength;

        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw aim circle on striker
        if (this.isPlacingStriker) {
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.striker.x, this.striker.y, this.striker.radius * 1.5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawPowerIndicator() {
        const barWidth = this.canvas.width * 0.1;
        const barHeight = this.canvas.height * 0.5;
        const barX = this.canvas.width * 0.05;
        const barY = this.canvas.height * 0.25;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Power fill
        const fillHeight = (this.power / this.maxPower) * barHeight;
        const gradient = this.ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(0.5, '#FFC107');
        gradient.addColorStop(1, '#F44336');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight);

        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Power text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${this.canvas.width * 0.04}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('POWER', barX + barWidth / 2, barY - 10);
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

        // Arrow in center circle pointing up
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const arrowSize = this.boardSize * 0.08;

        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - arrowSize);
        this.ctx.lineTo(centerX - arrowSize / 2, centerY + arrowSize / 2);
        this.ctx.lineTo(centerX + arrowSize / 2, centerY + arrowSize / 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Diagonal lines
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 1;
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

        // Baseline indicators
        const radius = this.boardSize * 0.025 * 1.3;
        const baselineY1 = this.boardY + this.boardSize - radius * 2.5;
        const baselineY2 = this.boardY + radius * 2.5;

        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        // Player baseline
        this.ctx.beginPath();
        this.ctx.moveTo(this.boardX + radius * 2, baselineY1);
        this.ctx.lineTo(this.boardX + this.boardSize - radius * 2, baselineY1);
        this.ctx.stroke();

        // Computer baseline
        this.ctx.beginPath();
        this.ctx.moveTo(this.boardX + radius * 2, baselineY2);
        this.ctx.lineTo(this.boardX + this.boardSize - radius * 2, baselineY2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawPockets() {
        const pockets = this.getPockets();
        const pocketRadius = this.boardSize * 0.04;

        pockets.forEach(pocket => {
            // Pocket hole
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Pocket rim
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Inner shadow
            const gradient = this.ctx.createRadialGradient(
                pocket.x, pocket.y, 0,
                pocket.x, pocket.y, pocketRadius
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
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
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Special marking for queen
        if (this.type === 'queen') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
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
