import { test, expect } from '@playwright/test';

test.describe('Path Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should analyze why same-row tiles cannot connect', async ({ page }) => {
    // Let's check the path between the 🀘 tiles at (0,0) and (0,12)
    const pathAnalysis = await page.evaluate(() => {
      const gameBoard = document.getElementById('game-board');
      const tiles = gameBoard.querySelectorAll('.tile');
      
      // Get the two 🀘 tiles from the test
      const tile1 = tiles[0 * 18 + 0];  // (0,0)
      const tile2 = tiles[0 * 18 + 12]; // (0,12)
      
      const result = {
        tile1: {
          position: { row: 0, col: 0 },
          symbol: tile1.textContent
        },
        tile2: {
          position: { row: 0, col: 12 },
          symbol: tile2.textContent
        },
        pathBetween: []
      };
      
      // Check every tile between (0,0) and (0,12)
      for (let col = 1; col < 12; col++) {
        const pathTile = tiles[0 * 18 + col];
        result.pathBetween.push({
          position: { row: 0, col },
          symbol: pathTile.textContent,
          empty: pathTile.classList.contains('empty')
        });
      }
      
      // Count how many tiles are blocking
      const blockers = result.pathBetween.filter(tile => !tile.empty);
      result.blockersCount = blockers.length;
      result.pathClear = blockers.length === 0;
      
      return result;
    });
    
    console.log('Path analysis between edge tiles:', JSON.stringify(pathAnalysis, null, 2));
    
    // This should show us exactly what's blocking the connection
    expect(pathAnalysis.tile1.symbol).toBe(pathAnalysis.tile2.symbol);
    expect(pathAnalysis.pathClear).toBe(false); // If they can't connect, path should be blocked
  });

  test('should show valid connections the solve button finds', async ({ page }) => {
    // Let's trace through what makes a connection valid
    const validConnection = await page.evaluate(() => {
      return new Promise((resolve) => {
        const gameBoard = document.getElementById('game-board');
        let connectionData = null;
        
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const tile = mutation.target;
              if (tile.classList.contains('selected')) {
                const row = parseInt(tile.dataset.row);
                const col = parseInt(tile.dataset.col);
                
                if (!connectionData) {
                  connectionData = {
                    tile1: { row, col, symbol: tile.textContent },
                    tile2: null
                  };
                } else if (!connectionData.tile2) {
                  connectionData.tile2 = { row, col, symbol: tile.textContent };
                  
                  // Analyze this valid connection
                  const t1 = connectionData.tile1;
                  const t2 = connectionData.tile2;
                  
                  connectionData.analysis = {
                    sameRow: t1.row === t2.row,
                    sameCol: t1.col === t2.col,
                    adjacent: Math.abs(t1.row - t2.row) + Math.abs(t1.col - t2.col) === 1
                  };
                  
                  if (t1.row === t2.row) {
                    // Check horizontal path
                    const startCol = Math.min(t1.col, t2.col);
                    const endCol = Math.max(t1.col, t2.col);
                    const pathTiles = [];
                    
                    for (let col = startCol + 1; col < endCol; col++) {
                      const pathTile = gameBoard.querySelector(`[data-row=\"${t1.row}\"][data-col=\"${col}\"]`);
                      pathTiles.push({
                        position: { row: t1.row, col },
                        empty: pathTile?.classList.contains('empty') || false,
                        symbol: pathTile?.textContent || null
                      });
                    }
                    
                    connectionData.analysis.horizontalPath = {
                      tiles: pathTiles,
                      allEmpty: pathTiles.every(tile => tile.empty)
                    };
                  }
                  
                  observer.disconnect();
                  resolve(connectionData);
                }
              }
            }
          });
        });
        
        observer.observe(gameBoard, {
          attributes: true,
          attributeFilter: ['class'],
          subtree: true
        });
        
        // Trigger solve
        document.getElementById('solve-game').click();
        
        setTimeout(() => {
          observer.disconnect();
          resolve({ error: 'timeout' });
        }, 2000);
      });
    });
    
    console.log('Valid connection analysis:', JSON.stringify(validConnection, null, 2));
    
    if (validConnection.tile1 && validConnection.tile2) {
      expect(validConnection.tile1.symbol).toBe(validConnection.tile2.symbol);
      
      // If it's a horizontal connection, the path should be clear
      if (validConnection.analysis.sameRow) {
        expect(validConnection.analysis.horizontalPath.allEmpty).toBe(true);
      }
    }
  });
});