class MahjongApp {
    constructor() {
        this.currentScreen = 'mode-selection';
        this.gameMode = null; // 'single' or 'multiplayer'
        this.game = null;
        this.supabase = null;
        this.playerId = this.generatePlayerId();
        this.playerName = this.generatePlayerName();
        this.roomId = null;
        this.multiplayerData = {
            player1: { name: '', score: 0 },
            player2: { name: '', score: 0 },
            isPlayer1: true,
            gameStarted: false,
            otherPlayerReady: false
        };

        this.initializeSupabase();
        this.setupEventListeners();
        this.loadHighScores();
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    generatePlayerName() {
        const adjectives = ['Swift', 'Clever', 'Sharp', 'Quick', 'Wise', 'Bold', 'Calm', 'Keen'];
        const nouns = ['Dragon', 'Phoenix', 'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion'];
        return adjectives[Math.floor(Math.random() * adjectives.length)] + 
               nouns[Math.floor(Math.random() * nouns.length)] + 
               Math.floor(Math.random() * 100);
    }

    async initializeSupabase() {
        // Note: In production, you would import Supabase properly
        // For now, we'll simulate the backend functionality
        console.log('Supabase would be initialized here with project: mhwhsilpkesykgtfvecu');
    }

    setupEventListeners() {
        // Mode selection
        document.getElementById('single-player-btn').addEventListener('click', () => {
            this.startSinglePlayer();
        });

        document.getElementById('multiplayer-btn').addEventListener('click', () => {
            this.startMultiplayer();
        });


        // Multiplayer room controls
        document.getElementById('start-multiplayer-game').addEventListener('click', () => {
            this.startMultiplayerGame();
        });

        document.getElementById('leave-room').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Game controls
        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('solve-game').addEventListener('click', () => {
            if (this.game) this.game.solveOneStep();
        });

        // Auto-solve with hold-button mechanism
        const autoSolveBtn = document.getElementById('auto-solve');
        autoSolveBtn.addEventListener('mousedown', () => {
            if (this.game) this.game.autoSolve();
        });
        autoSolveBtn.addEventListener('mouseup', () => {
            if (this.game) this.game.stopAutoSolve();
        });
        autoSolveBtn.addEventListener('mouseleave', () => {
            if (this.game) this.game.stopAutoSolve();
        });

        document.getElementById('pause-game').addEventListener('click', () => {
            if (this.game) this.game.togglePause();
        });

        document.getElementById('back-to-menu').addEventListener('click', () => {
            // Prevent accidental navigation during active gameplay
            if (this.game && this.game.tilesRemaining > 0) {
                const confirmExit = confirm('Are you sure you want to return to the main menu? Your current game progress will be lost.');
                if (confirmExit) {
                    this.backToMenu();
                }
            } else {
                this.backToMenu();
            }
        });

        // Completion modal
        document.getElementById('play-again').addEventListener('click', () => {
            this.playAgain();
        });

        document.getElementById('back-to-menu-final').addEventListener('click', () => {
            this.backToMenu();
        });
    }

    showScreen(screenName) {
        // Hide all screens
        document.getElementById('mode-selection').style.display = 'none';
        document.getElementById('waiting-room').style.display = 'none';
        document.getElementById('game-interface').style.display = 'none';
        document.getElementById('completion-modal').style.display = 'none';

        // Show requested screen
        if (screenName === 'mode-selection') {
            document.getElementById('mode-selection').style.display = 'block';
        } else if (screenName === 'waiting-room') {
            document.getElementById('waiting-room').style.display = 'block';
        } else if (screenName === 'game') {
            document.getElementById('game-interface').style.display = 'block';
        } else if (screenName === 'completion') {
            document.getElementById('completion-modal').style.display = 'flex';
        }

        this.currentScreen = screenName;
    }


    startSinglePlayer() {
        this.gameMode = 'single';
        document.getElementById('game-mode-display').textContent = 'Single Player';
        document.getElementById('multiplayer-stats').style.display = 'none';
        this.showScreen('game');
        this.game = new MahjongGame(this, 'single');
    }

    startMultiplayer() {
        this.gameMode = 'multiplayer';
        this.roomId = this.generateRoomId();
        document.getElementById('player-name').textContent = this.playerName;
        document.getElementById('room-id').textContent = this.roomId;
        this.showScreen('waiting-room');
        this.simulateMultiplayerRooms();
    }

    generateRoomId() {
        return 'room_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    simulateMultiplayerRooms() {
        // Simulate some available rooms
        const roomsList = document.getElementById('rooms-list');
        roomsList.innerHTML = '';
        
        const sampleRooms = [
            { id: 'ROOM_A1', player: 'SwiftDragon42', status: 'Waiting' },
            { id: 'ROOM_B7', player: 'CleverTiger88', status: 'Waiting' },
            { id: 'ROOM_C3', player: 'BoldEagle15', status: 'Waiting' }
        ];

        sampleRooms.forEach(room => {
            const roomDiv = document.createElement('div');
            roomDiv.className = 'room-item';
            roomDiv.innerHTML = `
                <div>
                    <strong>${room.id}</strong><br>
                    Player: ${room.player}
                </div>
                <button class="join-room-btn" onclick="app.joinRoom('${room.id}', '${room.player}')">
                    Join Room
                </button>
            `;
            roomsList.appendChild(roomDiv);
        });

        // Simulate player joining after random delay
        setTimeout(() => {
            this.simulatePlayerJoining();
        }, Math.random() * 10000 + 5000); // 5-15 seconds
    }

    simulatePlayerJoining() {
        const waitingMessage = document.getElementById('waiting-message');
        const startButton = document.getElementById('start-multiplayer-game');
        
        waitingMessage.textContent = 'Another player has joined! Both players ready to start.';
        startButton.style.display = 'inline-block';
        this.multiplayerData.otherPlayerReady = true;
        this.multiplayerData.player2.name = 'QuickFox77';
    }

    joinRoom(roomId, playerName) {
        this.roomId = roomId;
        document.getElementById('room-id').textContent = roomId;
        document.getElementById('waiting-message').textContent = `Joined ${playerName}'s room. Waiting for game to start...`;
        this.multiplayerData.isPlayer1 = false;
        this.multiplayerData.player1.name = playerName;
        this.multiplayerData.player2.name = this.playerName;
        
        // Simulate other player starting the game
        setTimeout(() => {
            document.getElementById('waiting-message').textContent = 'Both players ready! Game starting...';
            setTimeout(() => this.startMultiplayerGame(), 2000);
        }, Math.random() * 3000 + 2000);
    }

    startMultiplayerGame() {
        document.getElementById('game-mode-display').textContent = `Multiplayer (Difficulty: ${this.getDifficultyName()})`;
        document.getElementById('multiplayer-stats').style.display = 'flex';
        
        // Set up player names and scores
        if (this.multiplayerData.isPlayer1) {
            document.getElementById('player1-name').textContent = this.playerName + ' (You)';
            document.getElementById('player2-name').textContent = this.multiplayerData.player2.name;
        } else {
            document.getElementById('player1-name').textContent = this.multiplayerData.player1.name;
            document.getElementById('player2-name').textContent = this.playerName + ' (You)';
        }

        document.getElementById('player1-score').textContent = '0';
        document.getElementById('player2-score').textContent = '0';

        this.showScreen('game');
        this.game = new MahjongGame(this, 'multiplayer');
        this.multiplayerData.gameStarted = true;
    }

    leaveRoom() {
        this.roomId = null;
        this.multiplayerData = {
            player1: { name: '', score: 0 },
            player2: { name: '', score: 0 },
            isPlayer1: true,
            gameStarted: false,
            otherPlayerReady: false
        };
        this.showScreen('mode-selection');
    }

    backToMenu() {
        if (this.game) {
            this.game.cleanup();
            this.game = null;
        }
        this.leaveRoom();
        this.loadHighScores();
    }

    newGame() {
        if (this.game) {
            this.game.restart();
        } else {
            this.game = new MahjongGame(this, this.gameMode);
        }
        this.showScreen('game');
    }

    playAgain() {
        document.getElementById('completion-modal').style.display = 'none';
        // Create a completely new game
        this.game = new MahjongGame(this, this.gameMode);
        this.showScreen('game');
    }

    async loadHighScores() {
        // Simulate loading high scores
        const scoresList = document.getElementById('scores-list');
        const mockScores = [
            { name: 'SpeedMaster', time: '02:45' },
            { name: 'TileMaster99', time: '03:12' },
            { name: 'QuickSolver', time: '03:28' },
            { name: 'MahjongPro', time: '03:45' },
            { name: 'FastFinisher', time: '04:02' },
            { name: 'RapidRemover', time: '04:18' },
            { name: 'SwiftPlayer', time: '04:35' },
            { name: 'TileWiz', time: '04:52' },
            { name: 'QuickClick', time: '05:09' },
            { name: 'GameChamp', time: '05:26' }
        ];

        scoresList.innerHTML = '';
        mockScores.forEach(score => {
            const li = document.createElement('li');
            li.textContent = `${score.name} - ${score.time}`;
            scoresList.appendChild(li);
        });
    }

    async saveHighScore(playerName, timeInSeconds) {
        const timeStr = this.formatTime(timeInSeconds);
        console.log(`New high score: ${playerName} - ${timeStr}`);
        // In a real implementation, this would save to Supabase
        return Math.random() < 0.3; // 30% chance of being a high score
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    onGameComplete(timeInSeconds, isWinner = true) {
        let title, message;

        if (this.gameMode === 'single') {
            title = '🎉 Congratulations!';
            message = 'You successfully completed the puzzle!';
        } else {
            if (isWinner) {
                title = '🏆 Victory!';
                message = 'You won the multiplayer game!';
            } else {
                title = '😔 Game Over';
                message = 'Your opponent won this time.';
            }
        }

        document.getElementById('completion-title').textContent = title;
        document.getElementById('completion-message').textContent = message;
        document.getElementById('final-time').textContent = this.formatTime(timeInSeconds);

        if (this.gameMode === 'single') {
            this.saveHighScore(this.playerName, timeInSeconds).then(isHighScore => {
                if (isHighScore) {
                    document.getElementById('high-score-message').style.display = 'block';
                } else {
                    document.getElementById('high-score-message').style.display = 'none';
                }
            });
        } else {
            document.getElementById('high-score-message').style.display = 'none';
        }

        this.showScreen('completion');
    }

    updateMultiplayerScore(playerScore, opponentScore) {
        if (this.gameMode === 'multiplayer') {
            if (this.multiplayerData.isPlayer1) {
                document.getElementById('player1-score').textContent = playerScore;
                document.getElementById('player2-score').textContent = opponentScore;
            } else {
                document.getElementById('player1-score').textContent = opponentScore;
                document.getElementById('player2-score').textContent = playerScore;
            }
        }
    }
}

class MahjongGame {
    constructor(app, gameMode) {
        this.app = app;
        this.gameMode = gameMode;
        this.GRID_WIDTH = 10;
        this.GRID_HEIGHT = 8;
        this.TOTAL_TILES = 80;
        this.TILE_TYPES = 20;
        
        this.grid = [];
        this.selectedTile = null;
        this.tilesRemaining = this.TOTAL_TILES;
        this.gameStartTime = null;
        this.gamePaused = false;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.solvingInProgress = false;
        this.autoSolving = false;
        this.solveDelay = 400;
        this.solutionSequence = [];
        
        // Multiplayer specific
        this.playerScore = 0;
        this.opponentScore = 0;
        
        this.tileImages = [
            'bamboo1.png', 'bamboo2.png', 'bamboo3.png', 'bamboo4.png', 'bamboo5.png',
            'bamboo6.png', 'bamboo7.png', 'bamboo8.png', 'bamboo9.png',
            'circle1.png', 'circle2.png', 'circle3.png', 'circle4.png', 'circle5.png',
            'circle6.png', 'circle7.png', 'circle8.png', 'circle9.png',
            'spring.png', 'summer.png'
        ];
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.createGrid();
        this.populateGrid();
        this.renderGrid();
        this.updateTileCount();
        this.startTimer();
        this.checkSolutionAvailable();
    }

    createGrid() {
        this.grid = [];
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                this.grid[row][col] = null;
            }
        }
    }

    populateGrid() {
        // Generate a guaranteed solvable board using reverse construction
        this.generateGuaranteedSolvableBoard();
    }



    countRemainingTiles() {
        let count = 0;
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                if (this.grid[row][col] !== null) {
                    count++;
                }
            }
        }
        return count;
    }


    clearBoard() {
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                this.grid[row][col] = null;
            }
        }
    }




    getEmptyPositions() {
        const positions = [];
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                if (this.grid[row][col] === null) {
                    positions.push({ row, col });
                }
            }
        }
        return positions;
    }

    generateGuaranteedSolvableBoard() {
        console.log('Generating guaranteed solvable board using reverse construction...');
        this.clearBoard();
        this.solutionSequence = [];
        
        // Create all tile pairs (40 pairs total: 4 tiles of each type = 2 pairs per type)
        const tilePairs = this.createTilePairs();
        
        // Shuffle pairs for randomness
        this.shuffleArray(tilePairs);
        
        // Use reverse construction: place pairs that can be connected
        this.placePairsWithGuaranteedConnectivity(tilePairs);
        
        // Verify we have a complete solution
        console.log(`Board generated with ${this.solutionSequence.length} pairs in solution sequence`);
        console.log(`Tiles remaining: ${this.countRemainingTiles()}`);
    }

    createTilePairs() {
        const pairs = [];
        
        // Create 2 pairs for each tile type (4 tiles total per type)
        for (let type = 0; type < this.TILE_TYPES; type++) {
            for (let pairIndex = 0; pairIndex < 2; pairIndex++) {
                pairs.push({
                    type: type,
                    tile1: {
                        type: type,
                        image: this.tileImages[type],
                        id: `${type}-${pairIndex}-a`
                    },
                    tile2: {
                        type: type,
                        image: this.tileImages[type],
                        id: `${type}-${pairIndex}-b`
                    }
                });
            }
        }
        
        return pairs;
    }

    placePairsWithGuaranteedConnectivity(tilePairs) {
        // Place pairs using reverse construction to guarantee solvability
        for (let i = 0; i < tilePairs.length; i++) {
            const pair = tilePairs[i];
            const placed = this.placeSinglePair(pair);
            
            if (!placed) {
                console.warn(`Could not place pair ${i} of type ${pair.type}`);
                // Fallback: place in any available positions
                this.forcePlacePair(pair);
            }
        }
    }

    placeSinglePair(pair) {
        const emptyPositions = this.getEmptyPositions();
        if (emptyPositions.length < 2) return false;
        
        // Prioritize positions for better connectivity and randomness
        const positionPriorities = this.getPositionsByConnectivityPriority(emptyPositions);
        
        // Try to find two positions where the pair can be connected
        for (let attempts = 0; attempts < 100; attempts++) {
            // Select positions with bias toward better connectivity but still random
            const pos1 = this.selectWeightedRandomPosition(positionPriorities);
            const pos2 = this.selectWeightedRandomPosition(positionPriorities.filter(p => 
                p.row !== pos1.row || p.col !== pos1.col));
            
            if (!pos2) continue;
            
            // Temporarily place tiles to test connectivity
            this.grid[pos1.row][pos1.col] = pair.tile1;
            this.grid[pos2.row][pos2.col] = pair.tile2;
            
            // Check if they can be connected
            if (this.canConnect(pos1, pos2)) {
                // Success! Record this pair in solution sequence
                this.solutionSequence.push({
                    tile1: { row: pos1.row, col: pos1.col, type: pair.type },
                    tile2: { row: pos2.row, col: pos2.col, type: pair.type }
                });
                return true;
            } else {
                // Remove tiles and try again
                this.grid[pos1.row][pos1.col] = null;
                this.grid[pos2.row][pos2.col] = null;
            }
        }
        
        return false;
    }

    getPositionsByConnectivityPriority(positions) {
        return positions.map(pos => ({
            ...pos,
            priority: this.calculateConnectivityPriority(pos)
        })).sort((a, b) => b.priority - a.priority);
    }

    calculateConnectivityPriority(pos) {
        let priority = 0;
        
        // Corners have highest connectivity (can extend in 2 directions beyond grid)
        if ((pos.row === 0 || pos.row === this.GRID_HEIGHT - 1) && 
            (pos.col === 0 || pos.col === this.GRID_WIDTH - 1)) {
            priority += 100;
        }
        // Edges have good connectivity (can extend in 1 direction beyond grid)
        else if (pos.row === 0 || pos.row === this.GRID_HEIGHT - 1 || 
                 pos.col === 0 || pos.col === this.GRID_WIDTH - 1) {
            priority += 50;
        }
        // Interior positions have lower connectivity
        else {
            priority += 10;
        }
        
        // Add randomness factor
        priority += Math.random() * 20;
        
        return priority;
    }

    selectWeightedRandomPosition(prioritizedPositions) {
        if (prioritizedPositions.length === 0) return null;
        
        // Use weighted random selection favoring higher priority positions
        const totalWeight = prioritizedPositions.reduce((sum, pos) => sum + pos.priority, 0);
        let randomWeight = Math.random() * totalWeight;
        
        for (const pos of prioritizedPositions) {
            randomWeight -= pos.priority;
            if (randomWeight <= 0) {
                return pos;
            }
        }
        
        // Fallback to last position
        return prioritizedPositions[prioritizedPositions.length - 1];
    }

    forcePlacePair(pair) {
        // Emergency fallback: place pair in any two available positions
        const emptyPositions = this.getEmptyPositions();
        if (emptyPositions.length >= 2) {
            const pos1 = emptyPositions[0];
            const pos2 = emptyPositions[1];
            
            this.grid[pos1.row][pos1.col] = pair.tile1;
            this.grid[pos2.row][pos2.col] = pair.tile2;
            
            // Still record in solution (may not be immediately solvable but keeps board full)
            this.solutionSequence.push({
                tile1: { row: pos1.row, col: pos1.col, type: pair.type },
                tile2: { row: pos2.row, col: pos2.col, type: pair.type }
            });
        }
    }
    
    getPositionPriority(row, col) {
        // Higher priority for edge positions (easier to connect)
        let priority = 0;
        
        // Corners get highest priority
        if ((row === 0 || row === this.GRID_HEIGHT - 1) && 
            (col === 0 || col === this.GRID_WIDTH - 1)) {
            priority += 100;
        }
        // Edges get medium priority
        else if (row === 0 || row === this.GRID_HEIGHT - 1 || 
                 col === 0 || col === this.GRID_WIDTH - 1) {
            priority += 50;
        }
        // Interior gets lower priority
        else {
            priority += 10;
        }
        
        // Add randomness to avoid patterns
        priority += Math.random() * 10;
        
        return priority;
    }
    
    clearBoard() {
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                this.grid[row][col] = null;
            }
        }
    }

    generateFallbackBoard() {
        const tiles = [];
        
        for (let i = 0; i < this.TILE_TYPES; i++) {
            for (let j = 0; j < 4; j++) {
                tiles.push({
                    type: i,
                    image: this.tileImages[i],
                    id: `${i}-${j}`
                });
            }
        }
        
        this.shuffleArray(tiles);
        let tileIndex = 0;
        
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                this.grid[row][col] = tiles[tileIndex++];
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderGrid() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.style.position = 'relative'; // For connection lines
        
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                const tileElement = document.createElement('div');
                tileElement.className = 'tile';
                tileElement.dataset.row = row;
                tileElement.dataset.col = col;
                
                const tile = this.grid[row][col];
                if (tile) {
                    const img = document.createElement('img');
                    img.src = `images/${tile.image}`;
                    img.alt = `Tile ${tile.type}`;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';
                    tileElement.appendChild(img);
                    tileElement.dataset.type = tile.type;
                    tileElement.dataset.id = tile.id;
                    tileElement.addEventListener('click', () => this.handleTileClick(row, col));
                } else {
                    tileElement.classList.add('empty');
                }
                
                gameBoard.appendChild(tileElement);
            }
        }
    }

    handleTileClick(row, col) {
        if (this.gamePaused) return;
        
        // Allow clicks during solve animations - don't block on solvingInProgress
        const tile = this.grid[row][col];
        if (!tile) return;
        
        const tileElement = this.getTileElement(row, col);
        
        if (this.selectedTile) {
            if (this.selectedTile.row === row && this.selectedTile.col === col) {
                // Deselect the same tile
                this.deselectTile();
            } else if (this.selectedTile.type === tile.type) {
                // Check if tiles can be connected
                if (this.canConnect(this.selectedTile, { row, col })) {
                    // Capture the selected tile info before it might change
                    const tile1 = { row: this.selectedTile.row, col: this.selectedTile.col, type: this.selectedTile.type };
                    const tile2 = { row, col, type: tile.type };
                    
                    // Show connection line and remove tiles - no blocking
                    this.showConnectionLine(this.selectedTile, { row, col });
                    
                    // Clear selection and allow immediate new selections
                    this.deselectTile();
                    
                    // Remove tiles with animation but don't block further interactions
                    setTimeout(() => {
                        this.removeTilePair(tile1, tile2);
                    }, 800); // Show line for 800ms before removing
                } else {
                    this.showMessage('These tiles cannot be connected!', 'error');
                    this.deselectTile();
                    this.selectTile(row, col, tile);
                }
            } else {
                // Select different tile type
                this.deselectTile();
                this.selectTile(row, col, tile);
            }
        } else {
            // First tile selection
            this.selectTile(row, col, tile);
        }
    }


    selectTile(row, col, tile) {
        // First clear any existing selections
        this.clearAllSelections();
        
        this.selectedTile = { row, col, type: tile.type };
        this.getTileElement(row, col).classList.add('selected');
    }

    deselectTile() {
        if (this.selectedTile) {
            this.getTileElement(this.selectedTile.row, this.selectedTile.col).classList.remove('selected');
            this.selectedTile = null;
        }
        // Also clear any stray selected tiles
        this.clearAllSelections();
    }

    clearAllSelections() {
        // Clear any tiles that have the selected class
        document.querySelectorAll('.tile.selected').forEach(element => {
            element.classList.remove('selected');
        });
        this.selectedTile = null;
    }

    getTileElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    canConnect(pos1, pos2) {
        return this.findPath(pos1, pos2) !== null;
    }

    findPath(start, end) {
        // Implementation of path finding algorithm allowing up to 3 line segments
        const directions = [
            { dr: 0, dc: 1 },  // right
            { dr: 0, dc: -1 }, // left
            { dr: 1, dc: 0 },  // down
            { dr: -1, dc: 0 }  // up
        ];

        // Try direct connection (0 turns)
        if (this.canConnectDirectly(start, end)) {
            return [start, end];
        }

        // Try one turn (L-shape)
        for (let dir of directions) {
            const corner = this.findCorner(start, end, dir);
            if (corner && this.canConnectDirectly(start, corner) && this.canConnectDirectly(corner, end)) {
                return [start, corner, end];
            }
        }

        // Try two turns (Z-shape)
        for (let dir1 of directions) {
            for (let dir2 of directions) {
                if (dir1 === dir2) continue;
                
                const path = this.findTwoTurnPath(start, end, dir1, dir2);
                if (path) return path;
            }
        }

        return null;
    }

    canConnectDirectly(pos1, pos2) {
        if (pos1.row === pos2.row) {
            // Horizontal line
            const minCol = Math.min(pos1.col, pos2.col);
            const maxCol = Math.max(pos1.col, pos2.col);
            
            // Check if the line extends beyond grid boundaries
            const startCol = Math.max(0, minCol + 1);
            const endCol = Math.min(this.GRID_WIDTH - 1, maxCol - 1);
            
            // If the line is entirely outside the grid or positions are adjacent, it's valid
            if (startCol > endCol) return true;
            
            // Check for obstacles between positions within the grid
            for (let col = startCol; col <= endCol; col++) {
                if (pos1.row >= 0 && pos1.row < this.GRID_HEIGHT && this.grid[pos1.row][col] !== null) {
                    return false;
                }
            }
            return true;
        } else if (pos1.col === pos2.col) {
            // Vertical line
            const minRow = Math.min(pos1.row, pos2.row);
            const maxRow = Math.max(pos1.row, pos2.row);
            
            // Check if the line extends beyond grid boundaries
            const startRow = Math.max(0, minRow + 1);
            const endRow = Math.min(this.GRID_HEIGHT - 1, maxRow - 1);
            
            // If the line is entirely outside the grid or positions are adjacent, it's valid
            if (startRow > endRow) return true;
            
            // Check for obstacles between positions within the grid
            for (let row = startRow; row <= endRow; row++) {
                if (pos1.col >= 0 && pos1.col < this.GRID_WIDTH && this.grid[row][pos1.col] !== null) {
                    return false;
                }
            }
            return true;
        }
        
        return false;
    }

    findCorner(start, end, direction) {
        // Find corner point for L-shaped path
        const corner1 = { row: start.row, col: end.col };
        const corner2 = { row: end.row, col: start.col };
        
        if (this.isValidCorner(corner1)) return corner1;
        if (this.isValidCorner(corner2)) return corner2;
        
        return null;
    }

    isValidCorner(pos) {
        // Corner can be outside the grid (for line extensions) or on an empty cell
        if (pos.row < -1 || pos.row > this.GRID_HEIGHT || 
            pos.col < -1 || pos.col > this.GRID_WIDTH) {
            return false;
        }
        
        // If outside grid boundaries, it's valid (for line extensions beyond border)
        if (pos.row < 0 || pos.row >= this.GRID_HEIGHT || 
            pos.col < 0 || pos.col >= this.GRID_WIDTH) {
            return true;
        }
        
        // If inside grid, must be empty
        return this.grid[pos.row][pos.col] === null;
    }

    findTwoTurnPath(start, end, dir1, dir2) {
        // Find Z-shaped path with exactly 2 turns
        // The path goes: start -> corner1 -> corner2 -> end
        
        // Try all possible intermediate points
        for (let row = -1; row <= this.GRID_HEIGHT; row++) {
            for (let col = -1; col <= this.GRID_WIDTH; col++) {
                const corner1 = { row, col };
                
                // Check if corner1 is valid and can connect to start
                if (this.isValidCorner(corner1) && this.canConnectDirectly(start, corner1)) {
                    
                    // Try second corner points
                    for (let row2 = -1; row2 <= this.GRID_HEIGHT; row2++) {
                        for (let col2 = -1; col2 <= this.GRID_WIDTH; col2++) {
                            const corner2 = { row: row2, col: col2 };
                            
                            // Check if corner2 is valid and can connect corner1 to end
                            if (this.isValidCorner(corner2) && 
                                this.canConnectDirectly(corner1, corner2) && 
                                this.canConnectDirectly(corner2, end)) {
                                
                                // Make sure this creates a valid Z-shape (not just redundant corners)
                                if ((start.row !== corner1.row || corner1.row !== corner2.row || corner2.row !== end.row) &&
                                    (start.col !== corner1.col || corner1.col !== corner2.col || corner2.col !== end.col)) {
                                    return [start, corner1, corner2, end];
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    }

    isValidGridPosition(pos) {
        return pos.row >= 0 && pos.row < this.GRID_HEIGHT && 
               pos.col >= 0 && pos.col < this.GRID_WIDTH;
    }

    showConnectionLine(pos1, pos2, duration = 500) {
        const path = this.findPath(pos1, pos2);
        if (!path) return;

        // Clear existing lines
        document.querySelectorAll('.path-line').forEach(line => line.remove());

        const gameBoard = document.getElementById('game-board');
        const boardRect = gameBoard.getBoundingClientRect();
        
        // Draw lines between all path points (including outside board)
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            
            const line = document.createElement('div');
            line.className = 'path-line';
            
            // Calculate line position for both inside and outside grid positions
            const fromPoint = this.getPositionPoint(from, gameBoard, boardRect);
            const toPoint = this.getPositionPoint(to, gameBoard, boardRect);
            
            if (from.row === to.row) {
                // Horizontal line
                line.classList.add('horizontal');
                const left = Math.min(fromPoint.x, toPoint.x);
                const width = Math.abs(toPoint.x - fromPoint.x);
                const top = fromPoint.y - 1.5;
                
                line.style.left = left + 'px';
                line.style.top = top + 'px';
                line.style.width = width + 'px';
            } else {
                // Vertical line
                line.classList.add('vertical');
                const top = Math.min(fromPoint.y, toPoint.y);
                const height = Math.abs(toPoint.y - fromPoint.y);
                const left = fromPoint.x - 1.5;
                
                line.style.left = left + 'px';
                line.style.top = top + 'px';
                line.style.height = height + 'px';
            }
            
            gameBoard.appendChild(line);
        }

        // Remove lines after specified duration
        setTimeout(() => {
            document.querySelectorAll('.path-line').forEach(line => line.remove());
        }, duration);
    }
    
    getPositionPoint(pos, gameBoard, boardRect) {
        // Use consistent grid-based calculation for ALL positions (inside and outside)
        // This ensures perfect line connections
        
        // Account for board padding (15px padding from CSS)
        const padding = 15;
        const actualBoardWidth = boardRect.width - (2 * padding);
        const actualBoardHeight = boardRect.height - (2 * padding);
        const tileWidth = actualBoardWidth / this.GRID_WIDTH;
        const tileHeight = actualBoardHeight / this.GRID_HEIGHT;
        
        // Calculate grid-based position (works for both inside and outside positions)
        return {
            x: padding + (pos.col + 0.5) * tileWidth,
            y: padding + (pos.row + 0.5) * tileHeight
        };
    }

    removeTilePair(tile1, tile2) {
        this.grid[tile1.row][tile1.col] = null;
        this.grid[tile2.row][tile2.col] = null;
        
        const element1 = this.getTileElement(tile1.row, tile1.col);
        const element2 = this.getTileElement(tile2.row, tile2.col);
        
        // Clear any selected states from the elements being removed
        if (element1) {
            element1.classList.remove('selected');
            element1.innerHTML = '';
            element1.className = 'tile empty';
            element1.dataset.row = tile1.row;
            element1.dataset.col = tile1.col;
        }
        if (element2) {
            element2.classList.remove('selected');
            element2.innerHTML = '';
            element2.className = 'tile empty';
            element2.dataset.row = tile2.row;
            element2.dataset.col = tile2.col;
        }
        
        this.tilesRemaining -= 2;
        
        // Clear all visual selections to prevent stray highlights
        this.clearAllSelections();
        
        // Update scores
        if (this.gameMode === 'multiplayer') {
            this.playerScore += 2;
            this.app.updateMultiplayerScore(this.playerScore, this.opponentScore);
            
            // Simulate opponent moves
            this.simulateOpponentMove();
        }
        
        this.updateTileCount();
        this.checkGameComplete();
        this.checkSolutionAvailable();
        
        this.showMessage('Match found!', 'success');
    }

    simulateOpponentMove() {
        if (this.tilesRemaining <= 0) return;
        
        setTimeout(() => {
            // Random chance opponent makes a move
            if (Math.random() < 0.6) {
                this.opponentScore += 2;
                this.app.updateMultiplayerScore(this.playerScore, this.opponentScore);
                this.showMessage('Opponent found a match!', 'error');
            }
        }, Math.random() * 3000 + 1000);
    }

    updateTileCount() {
        document.getElementById('tiles-remaining').textContent = `Tiles: ${this.tilesRemaining}`;
        const connectablePairs = this.findAllMatches().length;
        document.getElementById('connectable-tiles').textContent = `Connectable: ${connectablePairs}`;
    }

    findAllMatches() {
        const matches = [];
        
        for (let row1 = 0; row1 < this.GRID_HEIGHT; row1++) {
            for (let col1 = 0; col1 < this.GRID_WIDTH; col1++) {
                const tile1 = this.grid[row1][col1];
                if (!tile1) continue;
                
                for (let row2 = row1; row2 < this.GRID_HEIGHT; row2++) {
                    const startCol = (row2 === row1) ? col1 + 1 : 0;
                    
                    for (let col2 = startCol; col2 < this.GRID_WIDTH; col2++) {
                        const tile2 = this.grid[row2][col2];
                        
                        if (tile2 && tile1.type === tile2.type && 
                            this.canConnect({ row: row1, col: col1 }, { row: row2, col: col2 })) {
                            matches.push([
                                { row: row1, col: col1, type: tile1.type },
                                { row: row2, col: col2, type: tile2.type }
                            ]);
                        }
                    }
                }
            }
        }
        
        return matches;
    }

    checkSolutionAvailable() {
        const matches = this.findAllMatches();
        const solutionStatus = document.getElementById('solution-status');
        
        if (matches.length > 0) {
            solutionStatus.textContent = 'Solution: Available';
            solutionStatus.className = 'available';
        } else {
            if (this.tilesRemaining === 0) {
                solutionStatus.textContent = '🎉 All Tiles Cleared!';
                solutionStatus.className = 'completed';
                this.showMessage('🎉 Congratulations! All tiles have been removed!', 'success');
            } else {
                solutionStatus.textContent = `No More Moves (${this.tilesRemaining} tiles left)`;
                solutionStatus.className = 'no-solution';
                this.showGameOverOptions();
            }
        }
    }

    showGameOverOptions() {
        const message = `Game Over! ${this.tilesRemaining} tiles cannot be connected.<br><br>
            <button onclick="app.game.restart()" class="game-over-btn">🔄 Try Again</button>
            <button onclick="app.newGame()" class="game-over-btn">🎮 New Game</button>`;
        
        document.getElementById('message').innerHTML = message;
        document.getElementById('message').className = 'error game-over-message';
    }

    solveOneStep() {
        const matches = this.findAllMatches();
        if (matches.length === 0) {
            this.showMessage('No more matches available!', 'error');
            return;
        }
        
        const [tile1, tile2] = matches[0];
        
        // Highlight the tiles to be removed
        const element1 = this.getTileElement(tile1.row, tile1.col);
        const element2 = this.getTileElement(tile2.row, tile2.col);
        
        if (element1) element1.classList.add('selected');
        if (element2) element2.classList.add('selected');
        
        // Show connection line with standard timing for manual solve
        this.showConnectionLine(tile1, tile2, 800);
        
        setTimeout(() => {
            if (element1) element1.classList.remove('selected');
            if (element2) element2.classList.remove('selected');
            this.removeTilePair(tile1, tile2);
        }, 800); // Show line for 800ms before removing
    }

    autoSolve() {
        // This is now called on mousedown - start auto-solving
        if (this.autoSolving) return;
        
        this.autoSolving = true;
        document.getElementById('solve-game').disabled = true;
        
        this.showMessage('Auto-solving... (release button to stop)', 'success');
        
        this.autoSolveStep();
    }

    stopAutoSolve() {
        // This is called on mouseup - stop auto-solving
        this.autoSolving = false;
        document.getElementById('solve-game').disabled = false;
        
        if (this.tilesRemaining > 0) {
            this.showMessage('Auto-solve stopped', 'success');
        }
    }

    autoSolveStep() {
        if (!this.autoSolving) return;
        
        const matches = this.findAllMatches();
        if (matches.length === 0 || this.tilesRemaining <= 0) {
            // Auto-solve complete
            this.autoSolving = false;
            document.getElementById('solve-game').disabled = false;
            
            if (this.tilesRemaining <= 0) {
                this.showMessage('Auto-solve complete!', 'success');
            } else {
                this.showMessage('No more matches available!', 'error');
            }
            return;
        }
        
        // Solve one step with connection line
        const [tile1, tile2] = matches[0];
        
        // Highlight tiles briefly
        const element1 = this.getTileElement(tile1.row, tile1.col);
        const element2 = this.getTileElement(tile2.row, tile2.col);
        
        if (element1 && element2) {
            element1.classList.add('selected');
            element2.classList.add('selected');
            
            // Show quick connection line for auto-solve
            this.showConnectionLine(tile1, tile2, 200);
            
            setTimeout(() => {
                element1.classList.remove('selected');
                element2.classList.remove('selected');
                this.removeTilePair(tile1, tile2);
                
                // Continue auto-solving with short delay
                setTimeout(() => {
                    this.autoSolveStep();
                }, 100);
            }, 200); // Quick timing for auto-solve
        }
    }


    checkGameComplete() {
        if (this.tilesRemaining <= 0) {
            this.stopTimer();
            const gameTime = this.getGameTime();
            
            if (this.gameMode === 'single') {
                this.app.onGameComplete(gameTime);
            } else {
                const isWinner = this.playerScore > this.opponentScore;
                this.app.onGameComplete(gameTime, isWinner);
            }
        }
    }

    startTimer() {
        this.gameStartTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (!this.gamePaused) {
                this.updateTimer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const gameTime = this.getGameTime();
        document.getElementById('timer').textContent = `Time: ${this.app.formatTime(gameTime)}`;
    }

    getGameTime() {
        if (!this.gameStartTime) return 0;
        return Math.floor((Date.now() - this.gameStartTime - this.pausedTime) / 1000);
    }

    togglePause() {
        if (this.gamePaused) {
            // Resume
            this.pausedTime += Date.now() - this.pauseStartTime;
            this.gamePaused = false;
            document.getElementById('pause-game').textContent = 'Pause';
            document.getElementById('message').textContent = '';
        } else {
            // Pause
            this.pauseStartTime = Date.now();
            this.gamePaused = true;
            document.getElementById('pause-game').textContent = 'Resume';
            this.showMessage('Game Paused', 'error');
        }
    }

    showMessage(text, type = '') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        
        setTimeout(() => {
            if (messageElement.textContent === text) {
                messageElement.textContent = '';
                messageElement.className = 'message';
            }
        }, 2000);
    }

    restart() {
        this.stopTimer();
        this.stopAutoSolve();
        this.tilesRemaining = this.TOTAL_TILES;
        this.playerScore = 0;
        this.opponentScore = 0;
        this.selectedTile = null;
        this.gamePaused = false;
        this.pausedTime = 0;
        this.solvingInProgress = false;
        this.autoSolving = false;
        this.solutionSequence = [];
        
        document.getElementById('pause-game').textContent = 'Pause';
        document.getElementById('auto-solve').disabled = false;
        document.getElementById('solve-game').disabled = false;
        document.querySelectorAll('.path-line').forEach(line => line.remove());
        
        this.initializeGame();
    }

    cleanup() {
        this.stopTimer();
        document.querySelectorAll('.path-line').forEach(line => line.remove());
    }

    setupEventListeners() {
        // Event listeners are handled by the main app
    }
}

// Initialize the application
const app = new MahjongApp();