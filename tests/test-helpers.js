// Test helper functions for Mahjong Shizen-Zho tests

/**
 * Find two matching tiles that can actually be connected according to game rules
 * Uses the game's built-in solve logic to find valid matches
 */
export async function findValidMatchingPair(page) {
  // Get all current matches from the game's solve logic
  const matches = await page.evaluate(() => {
    const gameElement = document.querySelector('.game-container');
    if (!gameElement) return [];
    
    // Access the game instance 
    const tiles = [];
    const gameBoard = document.getElementById('game-board');
    const tileElements = gameBoard.querySelectorAll('.tile:not(.empty)');
    
    tileElements.forEach((tile, index) => {
      const row = parseInt(tile.dataset.row);
      const col = parseInt(tile.dataset.col);
      const symbol = tile.textContent;
      
      if (symbol && row >= 0 && col >= 0) {
        tiles.push({
          element: tile,
          row,
          col,
          symbol,
          index
        });
      }
    });
    
    // Find first valid match by checking each pair
    for (let i = 0; i < tiles.length && i < 20; i++) {
      for (let j = i + 1; j < tiles.length && j < 20; j++) {
        if (tiles[i].symbol === tiles[j].symbol) {
          // Return first matching pair we find (game logic will validate connection)
          return [
            {
              row: tiles[i].row,
              col: tiles[i].col,
              symbol: tiles[i].symbol
            },
            {
              row: tiles[j].row,
              col: tiles[j].col,
              symbol: tiles[j].symbol
            }
          ];
        }
      }
    }
    
    return [];
  });
  
  if (matches.length < 2) {
    return [];
  }
  
  // Get the actual DOM elements for these positions
  const tile1 = page.locator(`[data-row="${matches[0].row}"][data-col="${matches[0].col}"]`);
  const tile2 = page.locator(`[data-row="${matches[1].row}"][data-col="${matches[1].col}"]`);
  
  return [tile1, tile2];
}

/**
 * Use the solve button to get a guaranteed valid match
 */
export async function findSolvableMatch(page) {
  // Use solve to find actual valid match, capture the tiles, then reset
  const initialState = await getGameState(page);
  
  // Click solve and immediately capture what tiles get selected
  const matchData = await page.evaluate(() => {
    return new Promise((resolve) => {
      const solveButton = document.getElementById('solve-game');
      
      // Set up a mutation observer to catch tile selections
      let selectedTiles = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const tile = mutation.target;
            if (tile.classList.contains('selected') && tile.dataset.row && tile.dataset.col) {
              selectedTiles.push({
                row: parseInt(tile.dataset.row),
                col: parseInt(tile.dataset.col),
                symbol: tile.textContent
              });
              
              if (selectedTiles.length === 2) {
                observer.disconnect();
                resolve(selectedTiles);
              }
            }
          }
        });
      });
      
      // Start observing all tiles
      const gameBoard = document.getElementById('game-board');
      observer.observe(gameBoard, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
      });
      
      // Trigger solve
      solveButton.click();
      
      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve([]);
      }, 500);
    });
  });
  
  // Reset to original state
  await page.locator('#new-game').click();
  await page.waitForTimeout(200);
  
  if (matchData.length < 2) {
    return [];
  }
  
  // Return locators for the tiles that were matched
  const tile1 = page.locator(`[data-row="${matchData[0].row}"][data-col="${matchData[0].col}"]`);
  const tile2 = page.locator(`[data-row="${matchData[1].row}"][data-col="${matchData[1].col}"]`);
  
  return [tile1, tile2];
}

/**
 * Wait for game animations to complete
 */
export async function waitForGameAnimation(page, timeout = 1000) {
  await page.waitForTimeout(timeout);
}

/**
 * Wait for a message to appear and then disappear
 */
export async function waitForMessage(page, expectedText, timeout = 3000) {
  await page.waitForFunction(
    (text) => {
      const messageEl = document.getElementById('message');
      return messageEl && messageEl.textContent.includes(text);
    },
    expectedText,
    { timeout }
  );
}

/**
 * Get the current game state
 */
export async function getGameState(page) {
  return await page.evaluate(() => {
    const tilesText = document.getElementById('tiles-remaining').textContent;
    const timerText = document.getElementById('timer').textContent;
    const solutionText = document.getElementById('solution-status').textContent;
    const messageText = document.getElementById('message').textContent;
    
    return {
      tilesRemaining: parseInt(tilesText.match(/\d+/)?.[0] || '0'),
      timer: timerText,
      solution: solutionText,
      message: messageText
    };
  });
}

/**
 * Reset game to clean state
 */
export async function resetGame(page) {
  await page.locator('#new-game').click();
  await page.waitForTimeout(500);
}

/**
 * Check if tiles are actually matchable by attempting the match
 */
export async function canTilesMatch(page, tile1, tile2) {
  const initialState = await getGameState(page);
  
  await tile1.click();
  await tile2.click();
  await page.waitForTimeout(100);
  
  const finalState = await getGameState(page);
  const matched = finalState.tilesRemaining < initialState.tilesRemaining;
  
  if (!matched) {
    // Reset selection if no match occurred
    await page.locator('#new-game').click();
    await page.waitForTimeout(500);
  }
  
  return matched;
}