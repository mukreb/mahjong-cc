// Supabase Configuration
class SupabaseManager {
    constructor() {
        // TODO: Replace with actual Supabase credentials
        this.SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
        this.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
        
        // Initialize Supabase client if credentials are provided
        if (this.SUPABASE_URL.startsWith('http') && this.SUPABASE_ANON_KEY.length > 20) {
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        } else {
            console.warn('Supabase credentials not configured. Using local storage fallback.');
            this.supabase = null;
        }
        
        this.tableName = 'mahjong_highscores';
    }
    
    async saveHighscore(playerName, completionTime) {
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .insert([
                        {
                            player_name: playerName,
                            completion_time: completionTime,
                            completed_at: new Date().toISOString()
                        }
                    ]);
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error saving to Supabase:', error);
                return this.saveHighscoreLocal(playerName, completionTime);
            }
        } else {
            return this.saveHighscoreLocal(playerName, completionTime);
        }
    }
    
    async getHighscores(limit = 10) {
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .select('player_name, completion_time, completed_at')
                    .order('completion_time', { ascending: true })
                    .limit(limit);
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching from Supabase:', error);
                return this.getHighscoresLocal();
            }
        } else {
            return this.getHighscoresLocal();
        }
    }
    
    saveHighscoreLocal(playerName, completionTime) {
        try {
            let highscores = JSON.parse(localStorage.getItem('mahjong_highscores') || '[]');
            highscores.push({
                player_name: playerName,
                completion_time: completionTime,
                completed_at: new Date().toISOString()
            });
            
            // Sort by completion time and keep only top 50
            highscores.sort((a, b) => a.completion_time - b.completion_time);
            highscores = highscores.slice(0, 50);
            
            localStorage.setItem('mahjong_highscores', JSON.stringify(highscores));
            return { success: true, data: highscores };
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return { success: false, error };
        }
    }
    
    getHighscoresLocal() {
        try {
            const highscores = JSON.parse(localStorage.getItem('mahjong_highscores') || '[]');
            return { success: true, data: highscores.slice(0, 10) };
        } catch (error) {
            console.error('Error fetching from local storage:', error);
            return { success: false, error };
        }
    }
}

class MahjongGame {
    constructor() {
        this.GRID_WIDTH = 18;
        this.GRID_HEIGHT = 8;
        this.TOTAL_TILES = 144;
        this.TILE_TYPES = 36;
        
        this.grid = [];
        this.selectedTile = null;
        this.tilesRemaining = this.TOTAL_TILES;
        this.gameStartTime = null;
        this.gamePaused = false;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.solvingInProgress = false;
        this.solveDelay = 400; // Reduced for faster rapid solving
        this.gameCompleted = false;
        
        // Initialize Supabase manager
        this.supabaseManager = new SupabaseManager();
        
        this.tileSymbols = [
            '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏',
            '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘',
            '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡',
            '🀢', '🀣', '🀤', '🀥', '🀦', '🀧', '🀨', '🀩', '🀪'
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
        // Generate a guaranteed solvable board using reverse generation
        this.generateSolvableBoard();
    }
    
    generateSolvableBoard() {
        // Start with all tiles placed on the board
        const tiles = [];
        
        for (let i = 0; i < this.TILE_TYPES; i++) {
            for (let j = 0; j < 4; j++) {
                tiles.push({
                    type: i,
                    symbol: this.tileSymbols[i],
                    id: `${i}-${j}`
                });
            }
        }
        
        // Place all tiles randomly first
        this.shuffleArray(tiles);
        let tileIndex = 0;
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                this.grid[row][col] = tiles[tileIndex++];
            }
        }
        
        // Now ensure solvability by performing a solvability check and shuffle if needed
        let attempts = 0;
        while (!this.isBoardSolvable() && attempts < 100) {
            // Reshuffle and try again
            this.shuffleArray(tiles);
            tileIndex = 0;
            for (let row = 0; row < this.GRID_HEIGHT; row++) {
                for (let col = 0; col < this.GRID_WIDTH; col++) {
                    this.grid[row][col] = tiles[tileIndex++];
                }
            }
            attempts++;
        }
        
        // If still not solvable after 100 attempts, use a simpler guaranteed method
        if (!this.isBoardSolvable()) {
            this.generateGuaranteedSolvableBoard();
        }
    }
    
    isBoardSolvable() {
        // Create a copy of the current board state
        const originalGrid = this.grid.map(row => [...row]);
        const originalTilesRemaining = this.tilesRemaining;
        
        // Try to solve the board completely
        let solvable = true;
        while (this.tilesRemaining > 0) {
            const matches = this.findAllMatches();
            if (matches.length === 0) {
                solvable = false;
                break;
            }
            
            // Remove the first available match
            const [tile1, tile2] = matches[0];
            this.grid[tile1.row][tile1.col] = null;
            this.grid[tile2.row][tile2.col] = null;
            this.tilesRemaining -= 2;
        }
        
        // Restore the original board state
        this.grid = originalGrid;
        this.tilesRemaining = originalTilesRemaining;
        
        return solvable;
    }
    
    generateGuaranteedSolvableBoard() {
        // Simple fallback: arrange tiles in a pattern that's guaranteed to be solvable
        // Place matching pairs adjacent to each other
        const tiles = [];
        
        for (let i = 0; i < this.TILE_TYPES; i++) {
            for (let j = 0; j < 4; j++) {
                tiles.push({
                    type: i,
                    symbol: this.tileSymbols[i],
                    id: `${i}-${j}`
                });
            }
        }
        
        // Arrange in pairs
        let tileIndex = 0;
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col += 2) {
                if (col + 1 < this.GRID_WIDTH && tileIndex < tiles.length) {
                    // Place matching pair
                    const tileType = Math.floor(tileIndex / 4);
                    this.grid[row][col] = {
                        type: tileType,
                        symbol: this.tileSymbols[tileType],
                        id: `${tileType}-${tileIndex % 4}`
                    };
                    this.grid[row][col + 1] = {
                        type: tileType,
                        symbol: this.tileSymbols[tileType],
                        id: `${tileType}-${(tileIndex + 1) % 4}`
                    };
                    tileIndex += 2;
                }
            }
        }
        
        // Shuffle the board while maintaining solvability
        this.shuffleSolvableBoard();
    }
    
    shuffleSolvableBoard() {
        // Perform random swaps while ensuring the board remains solvable
        for (let i = 0; i < 50; i++) {
            const row1 = Math.floor(Math.random() * this.GRID_HEIGHT);
            const col1 = Math.floor(Math.random() * this.GRID_WIDTH);
            const row2 = Math.floor(Math.random() * this.GRID_HEIGHT);
            const col2 = Math.floor(Math.random() * this.GRID_WIDTH);
            
            // Swap tiles
            const temp = this.grid[row1][col1];
            this.grid[row1][col1] = this.grid[row2][col2];
            this.grid[row2][col2] = temp;
            
            // Check if still solvable, if not, swap back
            if (!this.isBoardSolvable()) {
                this.grid[row2][col2] = this.grid[row1][col1];
                this.grid[row1][col1] = temp;
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
        
        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                const tileElement = document.createElement('div');
                tileElement.className = 'tile';
                tileElement.dataset.row = row;
                tileElement.dataset.col = col;
                
                const tile = this.grid[row][col];
                if (tile) {
                    tileElement.textContent = tile.symbol;
                    tileElement.dataset.tileId = tile.id;
                    tileElement.addEventListener('click', () => this.handleTileClick(row, col));
                } else {
                    tileElement.className += ' empty';
                }
                
                gameBoard.appendChild(tileElement);
            }
        }
    }
    
    handleTileClick(row, col) {
        const tile = this.grid[row][col];
        if (!tile) return;
        
        const tileElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (this.selectedTile) {
            if (this.selectedTile.row === row && this.selectedTile.col === col) {
                this.deselectTile();
                return;
            }
            
            if (this.canMatch(this.selectedTile, {row, col})) {
                this.drawConnectionLine(this.selectedTile, {row, col});
                setTimeout(() => {
                    this.removeTiles(this.selectedTile, {row, col});
                    this.clearConnectionLine();
                    this.deselectTile();
                    this.checkWinCondition();
                    this.checkSolutionAvailable();
                }, 500);
            } else {
                this.showMessage('These tiles cannot be connected!', 'error');
                this.deselectTile();
                this.selectTile(row, col);
            }
        } else {
            this.selectTile(row, col);
        }
    }
    
    selectTile(row, col) {
        this.selectedTile = {row, col};
        const tileElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        tileElement.classList.add('selected');
    }
    
    deselectTile() {
        if (this.selectedTile) {
            const tileElement = document.querySelector(`[data-row="${this.selectedTile.row}"][data-col="${this.selectedTile.col}"]`);
            if (tileElement) {
                tileElement.classList.remove('selected');
            }
        }
        this.selectedTile = null;
    }
    
    canMatch(tile1, tile2) {
        const t1 = this.grid[tile1.row][tile1.col];
        const t2 = this.grid[tile2.row][tile2.col];
        
        if (!t1 || !t2 || t1.type !== t2.type) {
            return false;
        }
        
        return this.canConnect(tile1, tile2);
    }
    
    canConnect(tile1, tile2) {
        if (this.directConnection(tile1, tile2)) return true;
        if (this.oneCornerConnection(tile1, tile2)) return true;
        if (this.twoCornerConnection(tile1, tile2)) return true;
        
        return false;
    }
    
    directConnection(tile1, tile2) {
        if (tile1.row === tile2.row) {
            return this.isHorizontalPathClear(tile1.row, tile1.col, tile2.col);
        }
        if (tile1.col === tile2.col) {
            return this.isVerticalPathClear(tile1.col, tile1.row, tile2.row);
        }
        return false;
    }
    
    oneCornerConnection(tile1, tile2) {
        const corner1 = {row: tile1.row, col: tile2.col};
        const corner2 = {row: tile2.row, col: tile1.col};
        
        if (this.isPositionEmptyForPath(corner1.row, corner1.col) &&
            this.canConnectToExtended(tile1, corner1) &&
            this.canConnectToExtended(corner1, tile2)) {
            return true;
        }
        
        if (this.isPositionEmptyForPath(corner2.row, corner2.col) &&
            this.canConnectToExtended(tile1, corner2) &&
            this.canConnectToExtended(corner2, tile2)) {
            return true;
        }
        
        return false;
    }
    
    twoCornerConnection(tile1, tile2) {
        // Try edge-based connections first - tiles on edges should be able to connect via the border
        if (this.canConnectViaEdges(tile1, tile2)) {
            return true;
        }
        
        // Original two-corner logic for interior connections
        for (let row = -1; row <= this.GRID_HEIGHT; row++) {
            for (let col = -1; col <= this.GRID_WIDTH; col++) {
                if (!this.isValidExtendedPosition(row, col)) continue;
                if (!this.isPositionEmptyForPath(row, col)) continue;
                
                const corner = {row, col};
                
                if (this.canConnectToExtended(tile1, corner) && 
                    this.canConnectToExtended(corner, tile2)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    canConnectViaEdges(tile1, tile2) {
        // Check if both tiles are on the same edge and can connect via that edge
        
        // Top edge (row 0) - connect via row -1
        if (tile1.row === 0 && tile2.row === 0) {
            return this.isHorizontalPathClearExtended(-1, tile1.col, tile2.col);
        }
        
        // Bottom edge (row 7) - connect via row 8
        if (tile1.row === this.GRID_HEIGHT - 1 && tile2.row === this.GRID_HEIGHT - 1) {
            return this.isHorizontalPathClearExtended(this.GRID_HEIGHT, tile1.col, tile2.col);
        }
        
        // Left edge (col 0) - connect via col -1
        if (tile1.col === 0 && tile2.col === 0) {
            return this.isVerticalPathClearExtended(-1, tile1.row, tile2.row);
        }
        
        // Right edge (col 17) - connect via col 18
        if (tile1.col === this.GRID_WIDTH - 1 && tile2.col === this.GRID_WIDTH - 1) {
            return this.isVerticalPathClearExtended(this.GRID_WIDTH, tile1.row, tile2.row);
        }
        
        return false;
    }
    
    canConnectToExtended(from, to) {
        if (from.row === to.row) {
            return this.isHorizontalPathClearExtended(from.row, from.col, to.col);
        }
        if (from.col === to.col) {
            return this.isVerticalPathClearExtended(from.col, from.row, to.row);
        }
        return false;
    }
    
    isValidExtendedPosition(row, col) {
        return row >= -1 && row <= this.GRID_HEIGHT && col >= -1 && col <= this.GRID_WIDTH;
    }
    
    isPositionEmpty(row, col) {
        if (row < 0 || row >= this.GRID_HEIGHT || col < 0 || col >= this.GRID_WIDTH) {
            return true;
        }
        return this.grid[row][col] === null;
    }
    
    isHorizontalPathClear(row, col1, col2) {
        const start = Math.min(col1, col2);
        const end = Math.max(col1, col2);
        
        for (let col = start + 1; col < end; col++) {
            if (!this.isPositionEmpty(row, col)) {
                return false;
            }
        }
        return true;
    }
    
    isVerticalPathClear(col, row1, row2) {
        const start = Math.min(row1, row2);
        const end = Math.max(row1, row2);
        
        for (let row = start + 1; row < end; row++) {
            if (!this.isPositionEmpty(row, col)) {
                return false;
            }
        }
        return true;
    }
    
    isHorizontalPathClearExtended(row, col1, col2) {
        const start = Math.min(col1, col2);
        const end = Math.max(col1, col2);
        
        for (let col = start + 1; col < end; col++) {
            // Only check positions that are within the grid bounds
            if (row >= 0 && row < this.GRID_HEIGHT && col >= 0 && col < this.GRID_WIDTH) {
                if (!this.isPositionEmpty(row, col)) {
                    return false;
                }
            }
            // Positions outside the grid are considered clear (no blocking)
        }
        return true;
    }
    
    isVerticalPathClearExtended(col, row1, row2) {
        const start = Math.min(row1, row2);
        const end = Math.max(row1, row2);
        
        for (let row = start + 1; row < end; row++) {
            // Only check positions that are within the grid bounds
            if (row >= 0 && row < this.GRID_HEIGHT && col >= 0 && col < this.GRID_WIDTH) {
                if (!this.isPositionEmpty(row, col)) {
                    return false;
                }
            }
            // Positions outside the grid are considered clear (no blocking)
        }
        return true;
    }
    
    removeTiles(tile1, tile2) {
        this.grid[tile1.row][tile1.col] = null;
        this.grid[tile2.row][tile2.col] = null;
        
        const element1 = document.querySelector(`[data-row="${tile1.row}"][data-col="${tile1.col}"]`);
        const element2 = document.querySelector(`[data-row="${tile2.row}"][data-col="${tile2.col}"]`);
        
        element1.className = 'tile empty';
        element1.textContent = '';
        element1.removeEventListener('click', this.handleTileClick);
        
        element2.className = 'tile empty';
        element2.textContent = '';
        element2.removeEventListener('click', this.handleTileClick);
        
        this.tilesRemaining -= 2;
        this.updateTileCount();
        this.showMessage('Match found!', 'success');
    }
    
    updateTileCount() {
        document.getElementById('tiles-remaining').textContent = `Tiles: ${this.tilesRemaining}`;
        this.updateConnectableCount();
    }
    
    updateConnectableCount() {
        const matches = this.findAllMatches();
        const connectableTiles = new Set();
        
        // Count unique tiles that can be connected
        matches.forEach(match => {
            const [tile1, tile2] = match;
            connectableTiles.add(`${tile1.row}-${tile1.col}`);
            connectableTiles.add(`${tile2.row}-${tile2.col}`);
        });
        
        document.getElementById('connectable-tiles').textContent = `Connectable: ${connectableTiles.size}`;
    }
    
    startTimer() {
        this.gameStartTime = Date.now();
        this.pausedTime = 0;
        this.gamePaused = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.gamePaused) {
                this.updateTimer();
            }
        }, 1000);
    }
    
    updateTimer() {
        if (this.gamePaused) return;
        
        const elapsed = Date.now() - this.gameStartTime - this.pausedTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = `Time: ${timeString}`;
    }
    
    pauseGame() {
        if (this.solvingInProgress) return;
        
        this.gamePaused = !this.gamePaused;
        const pauseButton = document.getElementById('pause-game');
        
        if (this.gamePaused) {
            this.pauseStartTime = Date.now();
            pauseButton.textContent = 'Resume';
            this.showMessage('Game paused', 'error');
        } else {
            this.pausedTime += Date.now() - this.pauseStartTime;
            pauseButton.textContent = 'Pause';
            this.showMessage('Game resumed', 'success');
        }
    }
    
    checkWinCondition() {
        if (this.tilesRemaining === 0 && !this.gameCompleted) {
            this.gameCompleted = true;
            
            // Calculate final time
            const finalTime = Date.now() - this.gameStartTime - this.pausedTime;
            const totalSeconds = Math.floor(finalTime / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Stop the timer
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            
            // Show highscore modal
            this.showHighscoreModal(totalSeconds, timeString);
        }
    }
    
    showHighscoreModal(completionTimeSeconds, timeString) {
        const modal = document.getElementById('highscore-modal');
        const completionMessage = document.getElementById('completion-message');
        
        completionMessage.textContent = `You completed the game in ${timeString}! 🎉`;
        
        // Load and display current highscores
        this.loadHighscores();
        
        // Show the modal
        modal.classList.remove('hidden');
        
        // Focus on name input
        setTimeout(() => {
            document.getElementById('player-name').focus();
        }, 100);
    }
    
    async loadHighscores() {
        const highscoresList = document.getElementById('highscores-list');
        highscoresList.innerHTML = '<div class="loading">Loading highscores...</div>';
        
        try {
            const result = await this.supabaseManager.getHighscores();
            
            if (result.success && result.data.length > 0) {
                this.displayHighscores(result.data);
            } else {
                highscoresList.innerHTML = '<div class="loading">No highscores yet. Be the first!</div>';
            }
        } catch (error) {
            console.error('Error loading highscores:', error);
            highscoresList.innerHTML = '<div class="error-message">Failed to load highscores</div>';
        }
    }
    
    displayHighscores(highscores) {
        const highscoresList = document.getElementById('highscores-list');
        
        if (highscores.length === 0) {
            highscoresList.innerHTML = '<div class="loading">No highscores yet. Be the first!</div>';
            return;
        }
        
        highscoresList.innerHTML = highscores
            .map((score, index) => {
                const minutes = Math.floor(score.completion_time / 60);
                const seconds = score.completion_time % 60;
                const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                return `
                    <div class="highscore-entry">
                        <div class="highscore-rank">${index + 1}.</div>
                        <div class="highscore-name">${this.escapeHtml(score.player_name)}</div>
                        <div class="highscore-time">${timeString}</div>
                    </div>
                `;
            })
            .join('');
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    async saveHighscore() {
        const playerName = document.getElementById('player-name').value.trim();
        
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }
        
        if (playerName.length > 20) {
            alert('Name must be 20 characters or less!');
            return;
        }
        
        // Calculate completion time in seconds
        const finalTime = Date.now() - this.gameStartTime - this.pausedTime;
        const completionTimeSeconds = Math.floor(finalTime / 1000);
        
        const saveButton = document.getElementById('save-score');
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        
        try {
            const result = await this.supabaseManager.saveHighscore(playerName, completionTimeSeconds);
            
            if (result.success) {
                this.showMessage('Highscore saved successfully!', 'success');
                // Reload highscores to show the updated list
                await this.loadHighscores();
            } else {
                this.showMessage('Failed to save highscore', 'error');
            }
        } catch (error) {
            console.error('Error saving highscore:', error);
            this.showMessage('Failed to save highscore', 'error');
        } finally {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
            this.closeHighscoreModal();
        }
    }
    
    closeHighscoreModal() {
        const modal = document.getElementById('highscore-modal');
        modal.classList.add('hidden');
        
        // Reset form
        document.getElementById('player-name').value = '';
    }
    
    async showHighscoresOnly() {
        const modal = document.getElementById('highscore-modal');
        const completionMessage = document.getElementById('completion-message');
        const form = document.querySelector('.highscore-form');
        
        // Hide completion message and form
        completionMessage.style.display = 'none';
        form.style.display = 'none';
        
        // Load and show highscores
        await this.loadHighscores();
        modal.classList.remove('hidden');
    }
    
    findAllMatches() {
        const matches = [];
        
        for (let row1 = 0; row1 < this.GRID_HEIGHT; row1++) {
            for (let col1 = 0; col1 < this.GRID_WIDTH; col1++) {
                const tile1 = this.grid[row1][col1];
                if (!tile1) continue;
                
                for (let row2 = row1; row2 < this.GRID_HEIGHT; row2++) {
                    for (let col2 = (row2 === row1 ? col1 + 1 : 0); col2 < this.GRID_WIDTH; col2++) {
                        const tile2 = this.grid[row2][col2];
                        if (!tile2) continue;
                        
                        if (this.canMatch({row: row1, col: col1}, {row: row2, col: col2})) {
                            matches.push([{row: row1, col: col1}, {row: row2, col: col2}]);
                        }
                    }
                }
            }
        }
        
        return matches;
    }
    
    checkSolutionAvailable() {
        const matches = this.findAllMatches();
        const statusElement = document.getElementById('solution-status');
        
        if (matches.length > 0) {
            statusElement.textContent = 'Solution: Available';
            statusElement.className = 'available';
            document.getElementById('solve-game').disabled = false;
        } else {
            statusElement.textContent = 'Solution: None';
            statusElement.className = 'no-solution';
            document.getElementById('solve-game').disabled = true;
        }
        
        this.updateConnectableCount();
    }
    
    async solveStep() {
        // Allow rapid solving by not blocking during solve steps
        if (this.solvingInProgress) return;
        
        this.solvingInProgress = true;
        
        const matches = this.findAllMatches();
        
        if (matches.length === 0) {
            this.showMessage('No solution available!', 'error');
            this.solvingInProgress = false;
            return;
        }
        
        for (const match of matches) {
            if (this.tilesRemaining === 0) break;
            
            const [tile1, tile2] = match;
            
            if (!this.grid[tile1.row][tile1.col] || !this.grid[tile2.row][tile2.col]) {
                continue;
            }
            
            if (!this.canMatch(tile1, tile2)) {
                continue;
            }
            
            this.highlightSolveStep(tile1, tile2);
            this.drawConnectionLine(tile1, tile2);
            
            await this.delay(this.solveDelay);
            
            this.removeTiles(tile1, tile2);
            this.clearConnectionLine();
            this.checkSolutionAvailable();
            
            await this.delay(100); // Reduced delay for faster rapid solving
            
            break;
        }
        
        this.solvingInProgress = false;
        
        // Keep solve button enabled for rapid solving unless no solutions remain
        const solveButton = document.getElementById('solve-game');
        if (this.tilesRemaining === 0 || this.findAllMatches().length === 0) {
            solveButton.disabled = true;
        } else {
            solveButton.disabled = false;
        }
    }
    
    highlightSolveStep(tile1, tile2) {
        const element1 = document.querySelector(`[data-row="${tile1.row}"][data-col="${tile1.col}"]`);
        const element2 = document.querySelector(`[data-row="${tile2.row}"][data-col="${tile2.col}"]`);
        
        element1.classList.add('selected');
        element2.classList.add('selected');
        
        setTimeout(() => {
            if (element1) element1.classList.remove('selected');
            if (element2) element2.classList.remove('selected');
        }, this.solveDelay - 100);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    drawConnectionLine(tile1, tile2) {
        this.clearConnectionLine();
        
        const gameBoard = document.getElementById('game-board');
        const boardRect = gameBoard.getBoundingClientRect();
        
        const tileWidth = boardRect.width / this.GRID_WIDTH;
        const tileHeight = boardRect.height / this.GRID_HEIGHT;
        
        const pos1 = {
            x: boardRect.left + (tile1.col + 0.5) * tileWidth,
            y: boardRect.top + (tile1.row + 0.5) * tileHeight
        };
        
        const pos2 = {
            x: boardRect.left + (tile2.col + 0.5) * tileWidth,
            y: boardRect.top + (tile2.row + 0.5) * tileHeight
        };
        
        const path = this.findConnectionPath(tile1, tile2);
        
        if (path.length > 1) {
            for (let i = 0; i < path.length - 1; i++) {
                const start = path[i];
                const end = path[i + 1];
                
                let startX, startY, endX, endY;
                
                if (start.col < 0) {
                    startX = boardRect.left - tileWidth * 0.5;
                } else if (start.col >= this.GRID_WIDTH) {
                    startX = boardRect.left + this.GRID_WIDTH * tileWidth + tileWidth * 0.5;
                } else {
                    startX = boardRect.left + (start.col + 0.5) * tileWidth;
                }
                
                if (start.row < 0) {
                    startY = boardRect.top - tileHeight * 0.5;
                } else if (start.row >= this.GRID_HEIGHT) {
                    startY = boardRect.top + this.GRID_HEIGHT * tileHeight + tileHeight * 0.5;
                } else {
                    startY = boardRect.top + (start.row + 0.5) * tileHeight;
                }
                
                if (end.col < 0) {
                    endX = boardRect.left - tileWidth * 0.5;
                } else if (end.col >= this.GRID_WIDTH) {
                    endX = boardRect.left + this.GRID_WIDTH * tileWidth + tileWidth * 0.5;
                } else {
                    endX = boardRect.left + (end.col + 0.5) * tileWidth;
                }
                
                if (end.row < 0) {
                    endY = boardRect.top - tileHeight * 0.5;
                } else if (end.row >= this.GRID_HEIGHT) {
                    endY = boardRect.top + this.GRID_HEIGHT * tileHeight + tileHeight * 0.5;
                } else {
                    endY = boardRect.top + (end.row + 0.5) * tileHeight;
                }
                
                const startPos = { x: startX, y: startY };
                const endPos = { x: endX, y: endY };
                
                this.createLineSegment(startPos, endPos);
            }
        }
    }
    
    findConnectionPath(tile1, tile2) {
        if (this.directConnection(tile1, tile2)) {
            return [tile1, tile2];
        }
        
        const corner1 = {row: tile1.row, col: tile2.col};
        const corner2 = {row: tile2.row, col: tile1.col};
        
        if (this.isPositionEmptyForPath(corner1.row, corner1.col) &&
            this.canConnectToExtended(tile1, corner1) &&
            this.canConnectToExtended(corner1, tile2)) {
            return [tile1, corner1, tile2];
        }
        
        if (this.isPositionEmptyForPath(corner2.row, corner2.col) &&
            this.canConnectToExtended(tile1, corner2) &&
            this.canConnectToExtended(corner2, tile2)) {
            return [tile1, corner2, tile2];
        }
        
        for (let row = -1; row <= this.GRID_HEIGHT; row++) {
            for (let col = -1; col <= this.GRID_WIDTH; col++) {
                if (!this.isValidExtendedPosition(row, col)) continue;
                if (!this.isPositionEmptyForPath(row, col)) continue;
                
                const corner = {row, col};
                
                if (this.canConnectToExtended(tile1, corner) && 
                    this.canConnectToExtended(corner, tile2)) {
                    return [tile1, corner, tile2];
                }
            }
        }
        
        return [tile1, tile2];
    }
    
    isPositionEmptyForPath(row, col) {
        if (row < 0 || row >= this.GRID_HEIGHT || col < 0 || col >= this.GRID_WIDTH) {
            return true;
        }
        return this.grid[row][col] === null;
    }
    
    createLineSegment(start, end) {
        const line = document.createElement('div');
        line.className = 'path-line';
        
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (Math.abs(dx) > Math.abs(dy)) {
            line.classList.add('horizontal');
            line.style.width = `${Math.abs(dx)}px`;
            line.style.height = '3px';
            line.style.left = `${Math.min(start.x, end.x)}px`;
            line.style.top = `${start.y - 1.5}px`;
        } else {
            line.classList.add('vertical');
            line.style.width = '3px';
            line.style.height = `${Math.abs(dy)}px`;
            line.style.left = `${start.x - 1.5}px`;
            line.style.top = `${Math.min(start.y, end.y)}px`;
        }
        
        line.style.position = 'fixed';
        line.style.zIndex = '1000';
        line.style.backgroundColor = '#4CAF50';
        line.style.pointerEvents = 'none';
        
        document.body.appendChild(line);
    }
    
    clearConnectionLine() {
        const lines = document.querySelectorAll('.path-line');
        lines.forEach(line => line.remove());
    }
    
    showMessage(text, type) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }, 2000);
    }
    
    setupEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.tilesRemaining = this.TOTAL_TILES;
            this.selectedTile = null;
            this.solvingInProgress = false;
            this.gamePaused = false;
            this.gameCompleted = false;
            this.clearConnectionLine();
            this.closeHighscoreModal();
            document.getElementById('pause-game').textContent = 'Pause';
            this.initializeGame();
            this.showMessage('New game started!', 'success');
        });
        
        document.getElementById('solve-game').addEventListener('click', () => {
            if (!this.gamePaused && !this.solvingInProgress) {
                this.solveStep();
            }
        });
        
        document.getElementById('pause-game').addEventListener('click', () => {
            this.pauseGame();
        });
        
        // Highscore modal event listeners
        document.getElementById('save-score').addEventListener('click', () => {
            this.saveHighscore();
        });
        
        document.getElementById('skip-save').addEventListener('click', () => {
            this.closeHighscoreModal();
        });
        
        document.getElementById('show-highscores').addEventListener('click', () => {
            this.showHighscoresOnly();
        });
        
        // Close modal when clicking outside
        document.getElementById('highscore-modal').addEventListener('click', (e) => {
            if (e.target.id === 'highscore-modal') {
                this.closeHighscoreModal();
                // Reset form display in case it was hidden
                document.getElementById('completion-message').style.display = 'block';
                document.querySelector('.highscore-form').style.display = 'flex';
            }
        });
        
        // Enter key to save highscore
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveHighscore();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MahjongGame();
});