import { test, expect } from '@playwright/test';
import { findSolvableMatch, waitForGameAnimation, getGameState } from './test-helpers.js';

test.describe('Game Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test.describe('New Game Button', () => {
    test('should reset the game when clicked', async ({ page }) => {
      // Make some progress in the game first
      const matchingTiles = await findSolvableMatch(page);
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        await waitForGameAnimation(page, 700);
      }
      
      // Click new game
      await page.locator('#new-game').click();
      await page.waitForTimeout(200);
      
      // Verify reset
      await expect(page.locator('#tiles-remaining')).toHaveText('Tiles: 144');
      await expect(page.locator('#timer')).toContainText('Time: 00:0');
      await expect(page.locator('#message')).toHaveText('New game started!');
      await expect(page.locator('#message')).toHaveClass(/success/);
    });

    test('should clear any selected tiles', async ({ page }) => {
      // Select a tile
      const firstTile = page.locator('.tile:not(.empty)').first();
      await firstTile.click();
      await expect(firstTile).toHaveClass(/selected/);
      
      // Start new game
      await page.locator('#new-game').click();
      
      // No tiles should be selected
      await expect(page.locator('.tile.selected')).toHaveCount(0);
    });

    test('should clear any connection lines', async ({ page }) => {
      // Try to create a connection line
      const matchingTiles = await findSolvableMatch(page);
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
      }
      
      // Start new game immediately
      await page.locator('#new-game').click();
      await page.waitForTimeout(200);
      
      // No connection lines should exist
      await expect(page.locator('.path-line')).toHaveCount(0);
    });

    test('should reset pause button text', async ({ page }) => {
      // Pause the game
      await page.locator('#pause-game').click();
      await expect(page.locator('#pause-game')).toHaveText('Resume');
      
      // Start new game
      await page.locator('#new-game').click();
      
      // Pause button should be reset
      await expect(page.locator('#pause-game')).toHaveText('Pause');
    });
  });

  test.describe('Solve Button', () => {
    test('should be enabled when solution is available', async ({ page }) => {
      await expect(page.locator('#solve-game')).toBeEnabled();
      await expect(page.locator('#solution-status')).toHaveText('Solution: Available');
    });

    test('should execute one solve step when clicked', async ({ page }) => {
      const initialState = await getGameState(page);
      
      await page.locator('#solve-game').click();
      
      // Wait for solve animation
      await waitForGameAnimation(page, 1000);
      
      // Should have removed 2 tiles
      const finalState = await getGameState(page);
      expect(finalState.tilesRemaining).toBe(initialState.tilesRemaining - 2);
    });

    test('should highlight tiles during solve step', async ({ page }) => {
      await page.locator('#solve-game').click();
      
      // Should see selected tiles briefly during animation
      await page.waitForTimeout(200);
      const selectedTiles = await page.locator('.tile.selected').count();
      expect(selectedTiles).toBe(2);
    });

    test('should show connection line during solve step', async ({ page }) => {
      await page.locator('#solve-game').click();
      
      // Should see connection line during animation
      await page.waitForTimeout(200);
      await expect(page.locator('.path-line')).toBeVisible();
      
      // Line should disappear after animation
      await page.waitForTimeout(1000);
      await expect(page.locator('.path-line')).toHaveCount(0);
    });

    test('should be disabled during solve animation', async ({ page }) => {
      await page.locator('#solve-game').click();
      
      // Button should be disabled during animation
      await expect(page.locator('#solve-game')).toBeDisabled();
      
      // Should be enabled again after animation
      await page.waitForTimeout(1000);
      await expect(page.locator('#solve-game')).toBeEnabled();
    });

    test('should update solution status after solve step', async ({ page }) => {
      await page.locator('#solve-game').click();
      await page.waitForTimeout(1000);
      
      // Solution status should still show available if moves remain
      const tilesRemaining = parseInt((await page.locator('#tiles-remaining').textContent()).match(/\d+/)[0]);
      if (tilesRemaining > 0) {
        await expect(page.locator('#solution-status')).toHaveText('Solution: Available');
      }
    });
  });

  test.describe('Pause Button', () => {
    test('should pause and resume the game', async ({ page }) => {
      // Get initial timer value
      await page.waitForTimeout(1000);
      const initialTime = await page.locator('#timer').textContent();
      
      // Pause the game
      await page.locator('#pause-game').click();
      await expect(page.locator('#pause-game')).toHaveText('Resume');
      await expect(page.locator('#message')).toHaveText('Game paused');
      await expect(page.locator('#message')).toHaveClass(/error/);
      
      // Wait and verify timer doesn't advance
      await page.waitForTimeout(2000);
      const pausedTime = await page.locator('#timer').textContent();
      expect(pausedTime).toBe(initialTime);
      
      // Resume the game
      await page.locator('#pause-game').click();
      await expect(page.locator('#pause-game')).toHaveText('Pause');
      await expect(page.locator('#message')).toHaveText('Game resumed');
      await expect(page.locator('#message')).toHaveClass(/success/);
    });

    test('should allow tile selection but prevent moves when paused', async ({ page }) => {
      // Pause the game
      await page.locator('#pause-game').click();
      await page.waitForTimeout(1000);
      
      // Verify game is paused
      await expect(page.locator('#pause-game')).toHaveText('Resume');
      
      // Get two matching tiles to test that moves are prevented
      const matchingTiles = await findSolvableMatch(page);
      
      if (matchingTiles.length >= 2) {
        const initialState = await getGameState(page);
        
        // Try to make a move while paused
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        await waitForGameAnimation(page, 500);
        
        const finalState = await getGameState(page);
        
        // Tiles should not be removed (move should be prevented)
        expect(finalState.tilesRemaining).toBe(initialState.tilesRemaining);
      } else {
        test.skip();
      }
    });

    test('should prevent solve button during pause', async ({ page }) => {
      // Pause the game
      await page.locator('#pause-game').click();
      
      // Try to click solve
      await page.locator('#solve-game').click();
      
      // Should not execute solve when paused
      await page.waitForTimeout(500);
      await expect(page.locator('#tiles-remaining')).toHaveText('Tiles: 144');
    });

    test('should not prevent new game when paused', async ({ page }) => {
      // Pause the game
      await page.locator('#pause-game').click();
      
      // Should still be able to start new game
      await page.locator('#new-game').click();
      await expect(page.locator('#message')).toHaveText('New game started!');
      await expect(page.locator('#pause-game')).toHaveText('Pause');
    });
  });

  test.describe('Solution Status', () => {
    test('should show "Available" when matches exist', async ({ page }) => {
      await expect(page.locator('#solution-status')).toHaveText('Solution: Available');
      await expect(page.locator('#solution-status')).toHaveClass(/available/);
    });

    test('should update after removing tiles', async ({ page }) => {
      // Remove some tiles
      const matchingTiles = await findSolvableMatch(page);
      if (matchingTiles.length >= 2) {
        await matchingTiles[0].click();
        await matchingTiles[1].click();
        await waitForGameAnimation(page, 700);
      }
      
      // Solution status should still be available (or no solution if board is unsolvable)
      const statusText = await page.locator('#solution-status').textContent();
      expect(statusText).toMatch(/Solution: (Available|None)/);
    });
  });
});

// Helper functions now in test-helpers.js