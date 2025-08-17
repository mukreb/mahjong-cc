import { test, expect } from '@playwright/test';

test.describe('Simple Connection Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should test specific tile connections manually', async ({ page }) => {
    // Let's manually test the tiles from the top row that should be connectable
    
    // First, let's try clicking the solve button to see what it finds
    console.log('Testing solve button functionality...');
    
    const initialState = await page.evaluate(() => ({
      tilesRemaining: document.getElementById('tiles-remaining').textContent
    }));
    
    console.log('Initial state:', initialState);
    
    // Click solve to see what the game considers a valid move
    await page.locator('#solve-game').click();
    await page.waitForTimeout(1000);
    
    const afterSolveState = await page.evaluate(() => ({
      tilesRemaining: document.getElementById('tiles-remaining').textContent,
      message: document.getElementById('message').textContent
    }));
    
    console.log('After solve state:', afterSolveState);
    
    // Reset and try manual connections
    await page.locator('#new-game').click();
    await page.waitForTimeout(500);
    
    // Try connecting two tiles that look like they should connect
    // Based on the debug output, let's try 🀩 tiles at (0,0) and (3,5)
    const connectionTest = await page.evaluate(() => {
      const gameBoard = document.getElementById('game-board');
      const tiles = gameBoard.querySelectorAll('.tile');
      
      // Get tiles at specific positions
      const tile1 = tiles[0 * 18 + 0]; // row 0, col 0
      const tile2 = tiles[3 * 18 + 5]; // row 3, col 5
      
      const result = {
        tile1: {
          position: { row: 0, col: 0 },
          symbol: tile1.textContent,
          empty: tile1.classList.contains('empty')
        },
        tile2: {
          position: { row: 3, col: 5 },
          symbol: tile2.textContent, 
          empty: tile2.classList.contains('empty')
        },
        sameSymbol: tile1.textContent === tile2.textContent
      };
      
      // Analyze the path between them
      // For a connection from (0,0) to (3,5), we need to check:
      // 1. Direct connection (not possible - different row and column)
      // 2. One corner: either (0,5) or (3,0)
      // 3. Two corner: through some external point
      
      const corner1 = tiles[0 * 18 + 5]; // (0,5)
      const corner2 = tiles[3 * 18 + 0]; // (3,0)
      
      result.pathAnalysis = {
        corner1: {
          position: { row: 0, col: 5 },
          symbol: corner1.textContent,
          empty: corner1.classList.contains('empty')
        },
        corner2: {
          position: { row: 3, col: 0 },
          symbol: corner2.textContent,
          empty: corner2.classList.contains('empty')
        }
      };
      
      // Check if horizontal paths are clear
      // From (0,0) to (0,5): check columns 1,2,3,4
      let path1Clear = true;
      const path1Blockers = [];
      for (let col = 1; col < 5; col++) {
        const pathTile = tiles[0 * 18 + col];
        if (!pathTile.classList.contains('empty')) {
          path1Clear = false;
          path1Blockers.push({
            position: { row: 0, col },
            symbol: pathTile.textContent
          });
        }
      }
      
      // From (3,0) to (3,5): check columns 1,2,3,4
      let path2Clear = true;
      const path2Blockers = [];
      for (let col = 1; col < 5; col++) {
        const pathTile = tiles[3 * 18 + col];
        if (!pathTile.classList.contains('empty')) {
          path2Clear = false;
          path2Blockers.push({
            position: { row: 3, col },
            symbol: pathTile.textContent
          });
        }
      }
      
      result.pathAnalysis.horizontalPaths = {
        path1: { clear: path1Clear, blockers: path1Blockers },
        path2: { clear: path2Clear, blockers: path2Blockers }
      };
      
      return result;
    });
    
    console.log('Connection test result:', JSON.stringify(connectionTest, null, 2));
    
    // Now try the actual click
    if (connectionTest.sameSymbol) {
      await page.locator('[data-row="0"][data-col="0"]').click();
      await page.waitForTimeout(100);
      
      await page.locator('[data-row="3"][data-col="5"]').click();
      await page.waitForTimeout(500);
      
      const finalState = await page.evaluate(() => ({
        tilesRemaining: document.getElementById('tiles-remaining').textContent,
        message: document.getElementById('message').textContent
      }));
      
      console.log('Final state after manual connection:', finalState);
      
      expect(connectionTest.sameSymbol).toBe(true);
    }
  });
});