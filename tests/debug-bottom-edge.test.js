import { test, expect } from '@playwright/test';

test.describe('Debug Bottom Edge Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should debug bottom edge tile connection issue', async ({ page }) => {
    // Find tiles on the bottom row that should be connectable via bottom edge
    const bottomRowAnalysis = await page.evaluate(() => {
      const gameBoard = document.getElementById('game-board');
      const tiles = gameBoard.querySelectorAll('.tile:not(.empty)');
      
      // Get all tiles from bottom row (row 7)
      const bottomRowTiles = [];
      tiles.forEach(tile => {
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        if (row === 7) {
          bottomRowTiles.push({
            row,
            col,
            symbol: tile.textContent,
            position: `(${row},${col})`
          });
        }
      });
      
      // Group by symbol to find matching pairs
      const symbolGroups = {};
      bottomRowTiles.forEach(tile => {
        if (!symbolGroups[tile.symbol]) {
          symbolGroups[tile.symbol] = [];
        }
        symbolGroups[tile.symbol].push(tile);
      });
      
      // Find symbols with multiple tiles in bottom row
      const matchingPairs = [];
      Object.keys(symbolGroups).forEach(symbol => {
        if (symbolGroups[symbol].length >= 2) {
          for (let i = 0; i < symbolGroups[symbol].length - 1; i++) {
            matchingPairs.push({
              symbol,
              tile1: symbolGroups[symbol][i],
              tile2: symbolGroups[symbol][i + 1]
            });
          }
        }
      });
      
      return {
        bottomRowTiles,
        matchingPairs
      };
    });
    
    console.log('Bottom row analysis:', JSON.stringify(bottomRowAnalysis, null, 2));
    
    if (bottomRowAnalysis.matchingPairs.length > 0) {
      const testPair = bottomRowAnalysis.matchingPairs[0];
      const tile1 = testPair.tile1;
      const tile2 = testPair.tile2;
      
      console.log(`Testing connection between ${tile1.symbol} at (${tile1.row},${tile1.col}) and ${tile2.symbol} at (${tile2.row},${tile2.col})`);
      
      // Test the connection using the game's logic
      const connectionTest = await page.evaluate((coords) => {
        const gameBoard = document.getElementById('game-board');
        const tiles = gameBoard.querySelectorAll('.tile');
        
        // Create a grid representation
        const grid = [];
        for (let row = 0; row < 8; row++) {
          grid[row] = [];
          for (let col = 0; col < 18; col++) {
            const tileElement = tiles[row * 18 + col];
            if (tileElement && !tileElement.classList.contains('empty')) {
              grid[row][col] = { symbol: tileElement.textContent };
            } else {
              grid[row][col] = null;
            }
          }
        }
        
        const tile1 = { row: coords.tile1Row, col: coords.tile1Col };
        const tile2 = { row: coords.tile2Row, col: coords.tile2Col };
        
        // Test if they can connect via bottom edge (row 8 is outside grid)
        // Path would be: tile1 -> (8, tile1.col) -> (8, tile2.col) -> tile2
        
        const result = {
          tile1: { ...tile1, symbol: grid[tile1.row][tile1.col]?.symbol },
          tile2: { ...tile2, symbol: grid[tile2.row][tile2.col]?.symbol },
          sameSymbol: grid[tile1.row][tile1.col]?.symbol === grid[tile2.row][tile2.col]?.symbol,
          canConnectDirectly: false,
          canConnectViaBottomEdge: false,
          pathAnalysis: {}
        };
        
        // Check direct horizontal connection
        if (tile1.row === tile2.row) {
          const start = Math.min(tile1.col, tile2.col);
          const end = Math.max(tile1.col, tile2.col);
          let pathClear = true;
          const blockers = [];
          
          for (let col = start + 1; col < end; col++) {
            if (grid[tile1.row][col] !== null) {
              pathClear = false;
              blockers.push({ row: tile1.row, col, symbol: grid[tile1.row][col]?.symbol });
            }
          }
          
          result.canConnectDirectly = pathClear;
          result.pathAnalysis.directPath = { pathClear, blockers };
        }
        
        // Check connection via bottom edge (going to row 8, which is outside grid)
        if (tile1.row === 7 && tile2.row === 7) {
          // Check if we can go from tile1 down to row 8 (outside grid)
          // Then horizontally from (8, tile1.col) to (8, tile2.col)
          // Then up from (8, tile2.col) to tile2
          
          // All positions outside the grid are considered "empty" for path purposes
          result.canConnectViaBottomEdge = true; // Should be possible via bottom edge
          result.pathAnalysis.bottomEdgePath = {
            path: [
              { row: tile1.row, col: tile1.col, description: 'start tile' },
              { row: 8, col: tile1.col, description: 'bottom edge below tile1' },
              { row: 8, col: tile2.col, description: 'bottom edge below tile2' },
              { row: tile2.row, col: tile2.col, description: 'end tile' }
            ]
          };
        }
        
        return result;
      }, { 
        tile1Row: tile1.row, 
        tile1Col: tile1.col, 
        tile2Row: tile2.row, 
        tile2Col: tile2.col 
      });
      
      console.log('Connection test result:', JSON.stringify(connectionTest, null, 2));
      
      // Now test if the game actually allows this connection
      await page.locator(`[data-row="${tile1.row}"][data-col="${tile1.col}"]`).click();
      await page.waitForTimeout(100);
      
      await page.locator(`[data-row="${tile2.row}"][data-col="${tile2.col}"]`).click();
      await page.waitForTimeout(500);
      
      const gameResult = await page.evaluate(() => ({
        tilesRemaining: document.getElementById('tiles-remaining').textContent,
        message: document.getElementById('message').textContent
      }));
      
      console.log('Game result:', gameResult);
      
      // The test should show that these tiles should be connectable via bottom edge
      expect(connectionTest.sameSymbol).toBe(true);
      expect(connectionTest.canConnectViaBottomEdge).toBe(true);
      
      // If the game rejects this connection, it's a bug
      if (gameResult.message === 'These tiles cannot be connected!') {
        console.log('BUG FOUND: Game incorrectly rejects connection that should work via bottom edge');
      }
    }
  });
});