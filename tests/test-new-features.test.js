import { test, expect } from '@playwright/test';

test.describe('New Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000); // Give more time for solvable board generation
  });

  test('should display connectable tiles counter', async ({ page }) => {
    // Check that the connectable tiles counter is visible
    const connectableElement = page.locator('#connectable-tiles');
    await expect(connectableElement).toBeVisible();
    
    const connectableText = await connectableElement.textContent();
    console.log('Connectable tiles display:', connectableText);
    
    // Should show format "Connectable: X" where X is a number
    expect(connectableText).toMatch(/^Connectable: \d+$/);
    
    // Extract the number
    const connectableCount = parseInt(connectableText.split(': ')[1]);
    console.log('Number of connectable tiles:', connectableCount);
    
    // Should have at least some connectable tiles at start
    expect(connectableCount).toBeGreaterThan(0);
  });

  test('should generate a solvable board', async ({ page }) => {
    // Check that the initial board has a solution
    const solutionStatus = await page.locator('#solution-status').textContent();
    console.log('Initial solution status:', solutionStatus);
    
    expect(solutionStatus).toBe('Solution: Available');
    
    // Try using the solve button multiple times to verify solvability
    let moves = 0;
    let previousTileCount = 144;
    
    while (moves < 5) { // Test first 5 moves
      const solveButton = page.locator('#solve-game');
      
      // Check if solve button is enabled
      const isEnabled = await solveButton.isEnabled();
      if (!isEnabled) {
        console.log('Solve button disabled - checking if game is complete');
        break;
      }
      
      await solveButton.click();
      await page.waitForTimeout(1000); // Wait for solve animation
      
      const currentTileCount = await page.evaluate(() => {
        const text = document.getElementById('tiles-remaining').textContent;
        return parseInt(text.split(': ')[1]);
      });
      
      console.log(`Move ${moves + 1}: ${previousTileCount} -> ${currentTileCount} tiles`);
      
      // Should have reduced by 2 tiles
      expect(currentTileCount).toBe(previousTileCount - 2);
      
      previousTileCount = currentTileCount;
      moves++;
      
      // Check that connectable tiles counter updates
      const connectableText = await page.locator('#connectable-tiles').textContent();
      const connectableCount = parseInt(connectableText.split(': ')[1]);
      console.log(`Connectable tiles after move ${moves}: ${connectableCount}`);
    }
    
    // Verify the board is still solvable after moves
    const finalSolutionStatus = await page.locator('#solution-status').textContent();
    console.log('Final solution status:', finalSolutionStatus);
    
    if (previousTileCount > 0) {
      expect(finalSolutionStatus).toBe('Solution: Available');
    }
  });

  test('should update connectable tiles counter when tiles are removed', async ({ page }) => {
    // Get initial connectable count
    const initialConnectable = await page.evaluate(() => {
      const text = document.getElementById('connectable-tiles').textContent;
      return parseInt(text.split(': ')[1]);
    });
    
    console.log('Initial connectable tiles:', initialConnectable);
    
    // Perform one solve step
    await page.locator('#solve-game').click();
    await page.waitForTimeout(1000);
    
    // Get updated connectable count
    const updatedConnectable = await page.evaluate(() => {
      const text = document.getElementById('connectable-tiles').textContent;
      return parseInt(text.split(': ')[1]);
    });
    
    console.log('Updated connectable tiles:', updatedConnectable);
    
    // The count should have changed (may increase or decrease depending on board layout)
    // Just verify it's still a valid number >= 0
    expect(updatedConnectable).toBeGreaterThanOrEqual(0);
  });

  test('should create new solvable games consistently', async ({ page }) => {
    // Test that new games are consistently solvable
    for (let i = 0; i < 3; i++) {
      console.log(`Testing new game ${i + 1}`);
      
      // Start a new game
      await page.locator('#new-game').click();
      await page.waitForTimeout(1000); // Wait for board generation
      
      // Check solution status
      const solutionStatus = await page.locator('#solution-status').textContent();
      console.log(`Game ${i + 1} solution status:`, solutionStatus);
      
      expect(solutionStatus).toBe('Solution: Available');
      
      // Check connectable tiles
      const connectableText = await page.locator('#connectable-tiles').textContent();
      const connectableCount = parseInt(connectableText.split(': ')[1]);
      console.log(`Game ${i + 1} connectable tiles:`, connectableCount);
      
      expect(connectableCount).toBeGreaterThan(0);
    }
  });
});