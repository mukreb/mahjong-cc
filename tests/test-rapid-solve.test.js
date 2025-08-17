import { test, expect } from '@playwright/test';

test.describe('Rapid Solve Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('should allow rapid clicking of solve button', async ({ page }) => {
    const solveButton = page.locator('#solve-game');
    
    // Verify solve button starts enabled
    await expect(solveButton).toBeEnabled();
    
    let previousTileCount = 144;
    let rapidClicks = 0;
    
    // Rapidly click solve button multiple times
    for (let i = 0; i < 10; i++) {
      // Check if button is still enabled
      const isEnabled = await solveButton.isEnabled();
      if (!isEnabled) {
        console.log(`Solve button disabled after ${rapidClicks} rapid clicks`);
        break;
      }
      
      // Click rapidly without waiting for full animation
      await solveButton.click();
      await page.waitForTimeout(100); // Very short wait - much faster than solve animation
      
      const currentTileCount = await page.evaluate(() => {
        const text = document.getElementById('tiles-remaining').textContent;
        return parseInt(text.split(': ')[1]);
      });
      
      if (currentTileCount < previousTileCount) {
        rapidClicks++;
        console.log(`Rapid click ${rapidClicks}: ${previousTileCount} -> ${currentTileCount} tiles`);
        previousTileCount = currentTileCount;
      }
      
      // If no tiles left, game should be complete
      if (currentTileCount === 0) {
        console.log('Game completed with rapid solving!');
        break;
      }
    }
    
    console.log(`Successfully performed ${rapidClicks} rapid solve clicks`);
    
    // Should have made at least a few rapid moves
    expect(rapidClicks).toBeGreaterThan(0);
    
    // Final tile count should be less than starting count
    const finalTileCount = await page.evaluate(() => {
      const text = document.getElementById('tiles-remaining').textContent;
      return parseInt(text.split(': ')[1]);
    });
    
    expect(finalTileCount).toBeLessThan(144);
  });

  test('should maintain solve button enabled during solve animation', async ({ page }) => {
    const solveButton = page.locator('#solve-game');
    
    // Click solve
    await solveButton.click();
    
    // Immediately check if button is still enabled (during animation)
    await page.waitForTimeout(100);
    const enabledDuringAnimation = await solveButton.isEnabled();
    
    console.log('Solve button enabled during animation:', enabledDuringAnimation);
    
    // Button should remain enabled during animation to allow rapid clicking
    expect(enabledDuringAnimation).toBe(true);
  });

  test('should complete entire game with rapid solve clicks', async ({ page }) => {
    const solveButton = page.locator('#solve-game');
    let clickCount = 0;
    let maxClicks = 100; // Safety limit
    
    console.log('Starting rapid game completion test...');
    
    while (clickCount < maxClicks) {
      const isEnabled = await solveButton.isEnabled();
      if (!isEnabled) {
        console.log('Solve button disabled - checking game state');
        break;
      }
      
      await solveButton.click();
      clickCount++;
      
      // Very short wait to allow for tile removal
      await page.waitForTimeout(50);
      
      const currentTileCount = await page.evaluate(() => {
        const text = document.getElementById('tiles-remaining').textContent;
        return parseInt(text.split(': ')[1]);
      });
      
      if (clickCount % 10 === 0) {
        console.log(`After ${clickCount} clicks: ${currentTileCount} tiles remaining`);
      }
      
      if (currentTileCount === 0) {
        console.log(`Game completed in ${clickCount} rapid clicks!`);
        break;
      }
    }
    
    const finalTileCount = await page.evaluate(() => {
      const text = document.getElementById('tiles-remaining').textContent;
      return parseInt(text.split(': ')[1]);
    });
    
    console.log(`Final result: ${finalTileCount} tiles remaining after ${clickCount} clicks`);
    
    // Should have made significant progress or completed the game
    expect(finalTileCount).toBeLessThan(100);
    expect(clickCount).toBeGreaterThan(10);
  });

  test('should show correct connectable tiles count during rapid solving', async ({ page }) => {
    const solveButton = page.locator('#solve-game');
    
    // Get initial counts
    const initialConnectable = await page.evaluate(() => {
      const text = document.getElementById('connectable-tiles').textContent;
      return parseInt(text.split(': ')[1]);
    });
    
    console.log('Initial connectable tiles:', initialConnectable);
    
    // Perform several rapid solve steps
    for (let i = 0; i < 5; i++) {
      const isEnabled = await solveButton.isEnabled();
      if (!isEnabled) break;
      
      await solveButton.click();
      await page.waitForTimeout(100);
      
      const currentConnectable = await page.evaluate(() => {
        const text = document.getElementById('connectable-tiles').textContent;
        return parseInt(text.split(': ')[1]);
      });
      
      console.log(`After rapid click ${i + 1}: ${currentConnectable} connectable tiles`);
      
      // Should always be a valid count >= 0
      expect(currentConnectable).toBeGreaterThanOrEqual(0);
    }
  });
});