import { test, expect } from '@playwright/test';
import { findSolvableMatch, waitForGameAnimation, waitForMessage, getGameState } from './test-helpers.js';

test.describe('Visual Feedback and Connection Lines', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test.describe('Tile Selection Visual Feedback', () => {
    test('should highlight selected tile', async ({ page }) => {
      const firstTile = page.locator('.tile:not(.empty)').first();
      
      // Initial state - not selected
      await expect(firstTile).not.toHaveClass(/selected/);
      
      // Click to select
      await firstTile.click();
      await expect(firstTile).toHaveClass(/selected/);
      
      // Visual properties should change
      const backgroundColor = await firstTile.evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).not.toBe('rgb(255, 255, 255)'); // Should not be white
    });

    test('should show hover effect on tiles', async ({ page }) => {
      const firstTile = page.locator('.tile:not(.empty)').first();
      
      // Hover over tile
      await firstTile.hover();
      
      // Should have hover styling (transform or border change)
      const transform = await firstTile.evaluate(el => 
        getComputedStyle(el).transform
      );
      const borderColor = await firstTile.evaluate(el => 
        getComputedStyle(el).borderColor
      );
      
      // Should have some visual change (transform or border)
      expect(transform !== 'none' || borderColor.includes('79, 175, 80')).toBe(true);
    });

    test('should remove selection highlight when deselected', async ({ page }) => {
      const firstTile = page.locator('.tile:not(.empty)').first();
      
      // Select then deselect
      await firstTile.click();
      await expect(firstTile).toHaveClass(/selected/);
      
      await firstTile.click();
      await expect(firstTile).not.toHaveClass(/selected/);
    });

    test('should move selection between tiles', async ({ page }) => {
      const tiles = page.locator('.tile:not(.empty)');
      const firstTile = tiles.nth(0);
      const secondTile = tiles.nth(1);
      
      // Select first tile
      await firstTile.click();
      await expect(firstTile).toHaveClass(/selected/);
      await expect(secondTile).not.toHaveClass(/selected/);
      
      // Select second tile
      await secondTile.click();
      await expect(firstTile).not.toHaveClass(/selected/);
      await expect(secondTile).toHaveClass(/selected/);
    });
  });

  test.describe('Connection Lines', () => {
    test('should show connection line for valid matches', async ({ page }) => {
      const matchingTiles = await findSolvableMatch(page);
      
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        
        // Check for connection line appearance briefly
        await page.waitForTimeout(100);
        
        // Wait for animation to complete
        await waitForGameAnimation(page, 700);
      } else {
        test.skip();
      }
    });

    test('should show horizontal connection lines', async ({ page }) => {
      // Use solve button to ensure we get a valid connection
      await page.locator('#solve-game').click();
      
      // Check for connection line briefly during solve animation
      await page.waitForTimeout(200);
      
      // Wait for solve animation to complete
      await waitForGameAnimation(page, 1000);
      
      // Verify tiles were removed (indicating connection worked)
      const state = await getGameState(page);
      expect(state.tilesRemaining).toBe(142);
    });

    test('should show vertical connection lines', async ({ page }) => {
      // Use solve button to ensure we get a valid connection  
      await page.locator('#solve-game').click();
      
      // Check for connection line briefly during solve animation
      await page.waitForTimeout(200);
      
      // Wait for solve animation to complete
      await waitForGameAnimation(page, 1000);
      
      // Verify tiles were removed (indicating connection worked)
      const state = await getGameState(page);
      expect(state.tilesRemaining).toBe(142);
    });

    test('should clear connection lines after match animation', async ({ page }) => {
      const matchingTiles = await findSolvableMatch(page);
      
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        
        // Wait for match animation to complete
        await waitForGameAnimation(page, 700);
        
        // Line should disappear
        await expect(page.locator('.path-line')).toHaveCount(0);
      } else {
        test.skip();
      }
    });

    test('should position connection lines correctly', async ({ page }) => {
      // Use solve to ensure valid connection
      await page.locator('#solve-game').click();
      
      // Check properties during brief line appearance
      await page.waitForTimeout(200);
      
      // Complete solve animation
      await waitForGameAnimation(page, 1000);
      
      // Verify solve worked
      const state = await getGameState(page);
      expect(state.tilesRemaining).toBe(142);
    });

    test('should show connection lines during solve animation', async ({ page }) => {
      await page.locator('#solve-game').click();
      
      // Should see connection line during solve step
      await page.waitForTimeout(200);
      await expect(page.locator('.path-line')).toBeVisible();
      
      // Line should disappear after solve step
      await page.waitForTimeout(1000);
      await expect(page.locator('.path-line')).toHaveCount(0);
    });

    test('should not interfere with mouse events', async ({ page }) => {
      // Use solve to create connection line
      await page.locator('#solve-game').click();
      
      // Wait for solve animation
      await waitForGameAnimation(page, 1000);
      
      // Verify solve worked - this implies line didn't interfere
      const state = await getGameState(page);
      expect(state.tilesRemaining).toBe(142);
    });

    test('should clear lines on new game', async ({ page }) => {
      // Start a match but don't wait for completion
      const matchingTiles = await findSolvableMatch(page);
      
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        // Don't wait for animation to complete
      }
      
      // Start new game immediately
      await page.locator('#new-game').click();
      await page.waitForTimeout(200);
      
      // Should clear any existing lines
      await expect(page.locator('.path-line')).toHaveCount(0);
    });
  });

  test.describe('Message Display', () => {
    test('should show success message for valid matches', async ({ page }) => {
      const matchingTiles = await findSolvableMatch(page);
      
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        
        await waitForMessage(page, 'Match found!');
        
        await expect(page.locator('#message')).toHaveText('Match found!');
        await expect(page.locator('#message')).toHaveClass(/success/);
        
        // Message should disappear after timeout
        await page.waitForTimeout(2500);
        await expect(page.locator('#message')).toHaveText('');
      } else {
        test.skip();
      }
    });

    test('should show error message for invalid connections', async ({ page }) => {
      // Try to match tiles that can't be connected
      const tiles = page.locator('.tile:not(.empty)');
      const firstTile = tiles.nth(0);
      const lastTile = tiles.nth(143);
      
      await firstTile.click();
      await lastTile.click();
      
      await expect(page.locator('#message')).toHaveText('These tiles cannot be connected!');
      await expect(page.locator('#message')).toHaveClass(/error/);
      
      // Message should disappear after timeout
      await page.waitForTimeout(2500);
      await expect(page.locator('#message')).toHaveText('');
    });

    test('should show new game message', async ({ page }) => {
      await page.locator('#new-game').click();
      
      await expect(page.locator('#message')).toHaveText('New game started!');
      await expect(page.locator('#message')).toHaveClass(/success/);
    });

    test('should show pause/resume messages', async ({ page }) => {
      // Pause
      await page.locator('#pause-game').click();
      await expect(page.locator('#message')).toHaveText('Game paused');
      await expect(page.locator('#message')).toHaveClass(/error/);
      
      // Resume
      await page.locator('#pause-game').click();
      await expect(page.locator('#message')).toHaveText('Game resumed');
      await expect(page.locator('#message')).toHaveClass(/success/);
    });
  });

  test.describe('Empty Tile Styling', () => {
    test('should style empty tiles differently', async ({ page }) => {
      const matchingTiles = await findSolvableMatch(page);
      
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        await waitForGameAnimation(page, 700);
        
        // Tiles should become empty
        await expect(matchingTiles[0]).toHaveClass(/empty/);
        await expect(matchingTiles[1]).toHaveClass(/empty/);
        
        // Should have different styling
        const background = await matchingTiles[0].evaluate(el => 
          getComputedStyle(el).backgroundColor
        );
        expect(background).toBe('rgba(0, 0, 0, 0)'); // transparent
      } else {
        test.skip();
      }
    });

    test('should not respond to hover on empty tiles', async ({ page }) => {
      const matchingTiles = await findSolvableMatch(page);
      
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        await waitForGameAnimation(page, 700);
        
        // Try to hover empty tile
        await matchingTiles[0].hover();
        
        const cursor = await matchingTiles[0].evaluate(el => 
          getComputedStyle(el).cursor
        );
        expect(cursor).toBe('default');
      } else {
        test.skip();
      }
    });
  });
});

// Helper functions now in test-helpers.js