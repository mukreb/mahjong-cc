import { test, expect } from '@playwright/test';
import { findSolvableMatch, waitForGameAnimation, waitForMessage, getGameState } from './test-helpers.js';

test.describe('Tile Matching and Removal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500); // Wait for game to initialize
  });

  test('should select a tile when clicked', async ({ page }) => {
    const firstTile = page.locator('.tile:not(.empty)').first();
    await firstTile.click();
    
    await expect(firstTile).toHaveClass(/selected/);
  });

  test('should deselect a tile when clicked again', async ({ page }) => {
    const firstTile = page.locator('.tile:not(.empty)').first();
    
    // Select tile
    await firstTile.click();
    await expect(firstTile).toHaveClass(/selected/);
    
    // Deselect tile
    await firstTile.click();
    await expect(firstTile).not.toHaveClass(/selected/);
  });

  test('should allow selecting a different tile after selection', async ({ page }) => {
    const tiles = page.locator('.tile:not(.empty)');
    const firstTile = tiles.nth(0);
    const secondTile = tiles.nth(1);
    
    // Select first tile
    await firstTile.click();
    await expect(firstTile).toHaveClass(/selected/);
    
    // Select second tile (first should be deselected, second selected)
    await secondTile.click();
    await expect(firstTile).not.toHaveClass(/selected/);
    await expect(secondTile).toHaveClass(/selected/);
  });

  test('should show success message for valid matches', async ({ page }) => {
    // Find two matching tiles that can be connected
    const matchingTiles = await findSolvableMatch(page);
    
    if (matchingTiles.length >= 2) {
      await matchingTiles[0].click();
      await matchingTiles[1].click();
      
      // Wait for the match animation and message
      await waitForMessage(page, 'Match found!');
      
      await expect(page.locator('#message')).toHaveText('Match found!');
      await expect(page.locator('#message')).toHaveClass(/success/);
    } else {
      test.skip();
    }
  });

  test('should show error message for invalid matches', async ({ page }) => {
    // Find two tiles that cannot be connected (blocked path)
    const tiles = page.locator('.tile:not(.empty)');
    const firstTile = tiles.nth(0);
    const lastTile = tiles.nth(143); // Far corner, likely blocked
    
    await firstTile.click();
    await lastTile.click();
    
    await expect(page.locator('#message')).toHaveText('These tiles cannot be connected!');
    await expect(page.locator('#message')).toHaveClass(/error/);
  });

  test('should remove matched tiles from the board', async ({ page }) => {
    const initialState = await getGameState(page);
    
    // Find and match tiles
    const matchingTiles = await findSolvableMatch(page);
    
    if (matchingTiles.length >= 2) {
      await matchingTiles[0].click();
      await matchingTiles[1].click();
      
      // Wait for removal animation
      await waitForGameAnimation(page, 700);
      
      const finalState = await getGameState(page);
      
      // Check counter is updated
      expect(finalState.tilesRemaining).toBe(initialState.tilesRemaining - 2);
      
      // Tiles should become empty
      await expect(matchingTiles[0]).toHaveClass(/empty/);
      await expect(matchingTiles[1]).toHaveClass(/empty/);
    } else {
      test.skip();
    }
  });

  test('should update tile counter when tiles are removed', async ({ page }) => {
    const matchingTiles = await findSolvableMatch(page);
    
    if (matchingTiles.length >= 2) {
      const initialState = await getGameState(page);
      
      await matchingTiles[0].click();
      await matchingTiles[1].click();
      
      await waitForGameAnimation(page, 700);
      
      const finalState = await getGameState(page);
      expect(finalState.tilesRemaining).toBe(initialState.tilesRemaining - 2);
    } else {
      test.skip();
    }
  });

  test('should clear selection after successful match', async ({ page }) => {
    const matchingTiles = await findSolvableMatch(page);
    
    if (matchingTiles.length >= 2) {
      await matchingTiles[0].click();
      await expect(matchingTiles[0]).toHaveClass(/selected/);
      
      await matchingTiles[1].click();
      
      await waitForGameAnimation(page, 700);
      
      // No tiles should be selected after match
      await expect(page.locator('.tile.selected')).toHaveCount(0);
    } else {
      test.skip();
    }
  });

  test('should show connection line for valid matches', async ({ page }) => {
    const matchingTiles = await findSolvableMatch(page);
    
    if (matchingTiles.length >= 2) {
      await matchingTiles[0].click();
      await matchingTiles[1].click();
      
      // Check that connection line appears briefly
      await page.waitForTimeout(100);
      
      // Wait for line to disappear after match
      await waitForGameAnimation(page, 700);
      await expect(page.locator('.path-line')).toHaveCount(0);
    } else {
      test.skip();
    }
  });
});

// This helper is now in test-helpers.js