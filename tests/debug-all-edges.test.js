import { test, expect } from '@playwright/test';

test.describe('Debug All Edge Connections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('should find edge tiles that should be connectable via border extension', async ({ page }) => {
    const allEdgeAnalysis = await page.evaluate(() => {
      const gameBoard = document.getElementById('game-board');
      const tiles = gameBoard.querySelectorAll('.tile:not(.empty)');
      
      const edgeTiles = {
        top: [],    // row 0
        bottom: [], // row 7  
        left: [],   // col 0
        right: []   // col 17
      };
      
      // Collect all edge tiles
      tiles.forEach(tile => {
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        const symbol = tile.textContent;
        
        if (row === 0) edgeTiles.top.push({ row, col, symbol });
        if (row === 7) edgeTiles.bottom.push({ row, col, symbol });
        if (col === 0) edgeTiles.left.push({ row, col, symbol });
        if (col === 17) edgeTiles.right.push({ row, col, symbol });
      });
      
      // Find matching pairs within each edge
      const findMatches = (edgeList, edgeName) => {
        const symbolGroups = {};
        edgeList.forEach(tile => {
          if (!symbolGroups[tile.symbol]) symbolGroups[tile.symbol] = [];
          symbolGroups[tile.symbol].push(tile);
        });
        
        const matches = [];
        Object.keys(symbolGroups).forEach(symbol => {
          if (symbolGroups[symbol].length >= 2) {
            for (let i = 0; i < symbolGroups[symbol].length - 1; i++) {
              matches.push({
                edge: edgeName,
                symbol,
                tile1: symbolGroups[symbol][i],
                tile2: symbolGroups[symbol][i + 1]
              });
            }
          }
        });
        return matches;
      };
      
      return {
        topMatches: findMatches(edgeTiles.top, 'top'),
        bottomMatches: findMatches(edgeTiles.bottom, 'bottom'),
        leftMatches: findMatches(edgeTiles.left, 'left'),
        rightMatches: findMatches(edgeTiles.right, 'right')
      };
    });
    
    console.log('All edge analysis:', JSON.stringify(allEdgeAnalysis, null, 2));
    
    // Test one match from each edge if available
    const testCases = [
      { edge: 'top', matches: allEdgeAnalysis.topMatches },
      { edge: 'bottom', matches: allEdgeAnalysis.bottomMatches },
      { edge: 'left', matches: allEdgeAnalysis.leftMatches },
      { edge: 'right', matches: allEdgeAnalysis.rightMatches }
    ];
    
    for (const testCase of testCases) {
      if (testCase.matches.length > 0) {
        const match = testCase.matches[0];
        console.log(`\nTesting ${testCase.edge} edge: ${match.symbol} at (${match.tile1.row},${match.tile1.col}) and (${match.tile2.row},${match.tile2.col})`);
        
        // Reset game state
        await page.locator('#new-game').click();
        await page.waitForTimeout(500);
        
        // Try the connection
        await page.locator(`[data-row="${match.tile1.row}"][data-col="${match.tile1.col}"]`).click();
        await page.waitForTimeout(100);
        
        await page.locator(`[data-row="${match.tile2.row}"][data-col="${match.tile2.col}"]`).click();
        await page.waitForTimeout(500);
        
        const result = await page.evaluate(() => ({
          tilesRemaining: document.getElementById('tiles-remaining').textContent,
          message: document.getElementById('message').textContent
        }));
        
        console.log(`${testCase.edge} edge result:`, result);
        
        if (result.message === 'These tiles cannot be connected!') {
          console.log(`BUG: ${testCase.edge} edge tiles incorrectly rejected`);
        } else if (result.message === 'Match found!') {
          console.log(`GOOD: ${testCase.edge} edge connection worked`);
        }
      } else {
        console.log(`No matching pairs found on ${testCase.edge} edge`);
      }
    }
    
    // The test should pass - we're just gathering data
    expect(true).toBe(true);
  });
});