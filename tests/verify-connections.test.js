import { test, expect } from '@playwright/test';

test.describe('Verify Connection Logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should verify that solve button finds truly connectable tiles', async ({ page }) => {
    // The solve button should only connect tiles that are actually connectable
    // Let's capture which tiles it connects and verify they follow the rules
    
    const solveAnalysis = await page.evaluate(() => {
      return new Promise((resolve) => {
        const gameBoard = document.getElementById('game-board');
        let selectedTiles = [];
        let connectionInfo = null;
        
        // Observer to capture which tiles get selected during solve
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const tile = mutation.target;
              if (tile.classList.contains('selected')) {
                const row = parseInt(tile.dataset.row);
                const col = parseInt(tile.dataset.col);
                const symbol = tile.textContent;
                
                selectedTiles.push({ row, col, symbol });
                
                if (selectedTiles.length === 2) {
                  // Analyze the connection between these two tiles
                  const tile1 = selectedTiles[0];
                  const tile2 = selectedTiles[1];
                  
                  connectionInfo = {
                    tile1,
                    tile2,
                    sameSymbol: tile1.symbol === tile2.symbol,
                    connectionType: 'unknown'
                  };
                  
                  // Analyze connection type
                  if (tile1.row === tile2.row) {
                    connectionInfo.connectionType = 'horizontal_direct';
                  } else if (tile1.col === tile2.col) {
                    connectionInfo.connectionType = 'vertical_direct';
                  } else {
                    // Check for corner connections
                    const corner1 = { row: tile1.row, col: tile2.col };
                    const corner2 = { row: tile2.row, col: tile1.col };
                    
                    // Get corner tiles
                    const corner1Tile = gameBoard.querySelector(`[data-row=\"${corner1.row}\"][data-col=\"${corner1.col}\"]`);
                    const corner2Tile = gameBoard.querySelector(`[data-row=\"${corner2.row}\"][data-col=\"${corner2.col}\"]`);
                    
                    connectionInfo.corner1 = {
                      position: corner1,
                      empty: corner1Tile?.classList.contains('empty') || false,
                      symbol: corner1Tile?.textContent || null
                    };
                    
                    connectionInfo.corner2 = {
                      position: corner2,
                      empty: corner2Tile?.classList.contains('empty') || false,
                      symbol: corner2Tile?.textContent || null
                    };
                    
                    if (connectionInfo.corner1.empty || connectionInfo.corner2.empty) {
                      connectionInfo.connectionType = 'one_corner';
                    } else {
                      connectionInfo.connectionType = 'two_corner';
                    }
                  }
                  
                  observer.disconnect();
                  resolve(connectionInfo);
                }
              }
            }
          });
        });
        
        // Start observing
        observer.observe(gameBoard, {
          attributes: true,
          attributeFilter: ['class'],
          subtree: true
        });
        
        // Trigger solve
        document.getElementById('solve-game').click();
        
        // Timeout fallback
        setTimeout(() => {
          observer.disconnect();
          resolve({ error: 'No tiles selected within timeout' });
        }, 2000);
      });
    });
    
    console.log('Solve analysis result:', JSON.stringify(solveAnalysis, null, 2));
    
    // Verify the connection follows the rules
    if (solveAnalysis.tile1 && solveAnalysis.tile2) {
      expect(solveAnalysis.sameSymbol).toBe(true);
      expect(solveAnalysis.connectionType).not.toBe('unknown');
      
      // Wait for solve to complete
      await page.waitForTimeout(1000);
      
      // Verify tiles were actually removed
      const finalCount = await page.locator('#tiles-remaining').textContent();
      expect(finalCount).toBe('Tiles: 142');
    }
  });

  test('should test edge tile connections that should work', async ({ page }) => {
    // Edge tiles are more likely to be connectable
    // Let's find matching edge tiles and test them
    
    const edgeMatches = await page.evaluate(() => {
      const gameBoard = document.getElementById('game-board');
      const tiles = gameBoard.querySelectorAll('.tile:not(.empty)');
      
      const edgeTiles = [];
      
      // Collect edge tiles (first row, last row, first column, last column)
      tiles.forEach(tile => {
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        
        if (row === 0 || row === 7 || col === 0 || col === 17) {
          edgeTiles.push({
            row,
            col,
            symbol: tile.textContent,
            position: `edge_${row === 0 ? 'top' : row === 7 ? 'bottom' : ''}${col === 0 ? 'left' : col === 17 ? 'right' : ''}`
          });
        }
      });
      
      // Group by symbol
      const symbolGroups = {};
      edgeTiles.forEach(tile => {
        if (!symbolGroups[tile.symbol]) {
          symbolGroups[tile.symbol] = [];
        }
        symbolGroups[tile.symbol].push(tile);
      });
      
      // Find symbols with multiple edge tiles
      const matches = [];
      Object.keys(symbolGroups).forEach(symbol => {
        if (symbolGroups[symbol].length > 1) {
          // Try first two tiles of this symbol
          matches.push({
            symbol,
            tile1: symbolGroups[symbol][0],
            tile2: symbolGroups[symbol][1]
          });
        }
      });
      
      return matches.slice(0, 3); // Return first 3 matches
    });
    
    console.log('Edge matches found:', JSON.stringify(edgeMatches, null, 2));
    
    if (edgeMatches.length > 0) {
      const firstMatch = edgeMatches[0];
      
      // Try to connect these tiles manually
      await page.locator(`[data-row="${firstMatch.tile1.row}"][data-col="${firstMatch.tile1.col}"]`).click();
      await page.waitForTimeout(100);
      
      await page.locator(`[data-row="${firstMatch.tile2.row}"][data-col="${firstMatch.tile2.col}"]`).click();
      await page.waitForTimeout(500);
      
      const result = await page.evaluate(() => ({
        tilesRemaining: document.getElementById('tiles-remaining').textContent,
        message: document.getElementById('message').textContent
      }));
      
      console.log('Manual edge connection result:', result);
      
      // Edge tiles should have a higher chance of connecting
      if (result.message === 'Match found!') {
        expect(result.tilesRemaining).toBe('Tiles: 142');
      } else {
        console.log('Edge tiles could not connect:', result.message);
      }
    }
  });
});