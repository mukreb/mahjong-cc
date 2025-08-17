import { test, expect } from '@playwright/test';

test.describe('Debug Connection Issues', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should debug specific tile connection issues', async ({ page }) => {
    // Add debugging function to the page
    await page.evaluate(() => {
      window.debugConnection = (tile1Row, tile1Col, tile2Row, tile2Col) => {
        const gameBoard = document.getElementById('game-board');
        const gameInstance = gameBoard.__gameInstance || window.gameInstance;
        
        if (!gameInstance) {
          // Try to find the game instance
          const tiles = gameBoard.querySelectorAll('.tile');
          if (tiles.length > 0 && tiles[0].onclick) {
            // Extract game instance from the click handler context
            console.log('No direct game instance found');
            return { error: 'No game instance found' };
          }
        }
        
        const tile1 = { row: tile1Row, col: tile1Col };
        const tile2 = { row: tile2Row, col: tile2Col };
        
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
        
        // Check if tiles have same symbol
        const t1 = grid[tile1Row][tile1Col];
        const t2 = grid[tile2Row][tile2Col];
        
        const result = {
          tile1: { row: tile1Row, col: tile1Col, symbol: t1?.symbol },
          tile2: { row: tile2Row, col: tile2Col, symbol: t2?.symbol },
          sameSymbol: t1?.symbol === t2?.symbol,
          directConnection: false,
          oneCornerConnection: false,
          twoCornerConnection: false,
          pathAnalysis: {}
        };
        
        if (!t1 || !t2) {
          result.error = 'One or both tiles are empty';
          return result;
        }
        
        if (t1.symbol !== t2.symbol) {
          result.error = 'Tiles have different symbols';
          return result;
        }
        
        // Check direct connection
        if (tile1Row === tile2Row) {
          // Horizontal path
          const start = Math.min(tile1Col, tile2Col);
          const end = Math.max(tile1Col, tile2Col);
          let pathClear = true;
          const blockedBy = [];
          
          for (let col = start + 1; col < end; col++) {
            if (grid[tile1Row][col] !== null) {
              pathClear = false;
              blockedBy.push({ row: tile1Row, col, symbol: grid[tile1Row][col]?.symbol });
            }
          }
          
          result.directConnection = pathClear;
          result.pathAnalysis.horizontal = { pathClear, blockedBy };
        } else if (tile1Col === tile2Col) {
          // Vertical path
          const start = Math.min(tile1Row, tile2Row);
          const end = Math.max(tile1Row, tile2Row);
          let pathClear = true;
          const blockedBy = [];
          
          for (let row = start + 1; row < end; row++) {
            if (grid[row][tile1Col] !== null) {
              pathClear = false;
              blockedBy.push({ row, col: tile1Col, symbol: grid[row][tile1Col]?.symbol });
            }
          }
          
          result.directConnection = pathClear;
          result.pathAnalysis.vertical = { pathClear, blockedBy };
        }
        
        // Check one corner connections
        const corner1 = { row: tile1Row, col: tile2Col };
        const corner2 = { row: tile2Row, col: tile1Col };
        
        // Check if corners are empty
        const corner1Empty = grid[corner1.row][corner1.col] === null;
        const corner2Empty = grid[corner2.row][corner2.col] === null;
        
        result.pathAnalysis.corner1 = { 
          position: corner1, 
          empty: corner1Empty, 
          symbol: grid[corner1.row]?.[corner1.col]?.symbol 
        };
        result.pathAnalysis.corner2 = { 
          position: corner2, 
          empty: corner2Empty, 
          symbol: grid[corner2.row]?.[corner2.col]?.symbol 
        };
        
        return result;
      };
    });
    
    // Get the positions of the green highlighted tiles from the screenshot
    // Based on the image, it looks like there are bamboo tiles at different positions
    
    // Let's find tiles with the same symbol that should be connectable
    const analysisResult = await page.evaluate(() => {
      const gameBoard = document.getElementById('game-board');
      const tiles = gameBoard.querySelectorAll('.tile:not(.empty)');
      const tilePositions = {};
      
      // Group tiles by symbol
      tiles.forEach((tile, index) => {
        const symbol = tile.textContent.trim();
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        
        if (!tilePositions[symbol]) {
          tilePositions[symbol] = [];
        }
        tilePositions[symbol].push({ row, col, element: tile });
      });
      
      // Find symbols that appear multiple times
      const duplicates = {};
      Object.keys(tilePositions).forEach(symbol => {
        if (tilePositions[symbol].length > 1) {
          duplicates[symbol] = tilePositions[symbol];
        }
      });
      
      return duplicates;
    });
    
    console.log('Tile analysis:', analysisResult);
    
    // Test the first pair of matching tiles we find
    const symbolKeys = Object.keys(analysisResult);
    if (symbolKeys.length > 0) {
      const firstSymbol = symbolKeys[0];
      const positions = analysisResult[firstSymbol];
      
      if (positions.length >= 2) {
        const tile1 = positions[0];
        const tile2 = positions[1];
        
        const debugResult = await page.evaluate((coords) => {
          return window.debugConnection(coords.t1Row, coords.t1Col, coords.t2Row, coords.t2Col);
        }, { t1Row: tile1.row, t1Col: tile1.col, t2Row: tile2.row, t2Col: tile2.col });
        
        console.log('Debug result for tiles:', debugResult);
        
        // The test should help us understand why tiles can't connect
        expect(debugResult).toBeDefined();
        expect(debugResult.sameSymbol).toBe(true);
      }
    }
  });
});