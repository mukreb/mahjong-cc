import { test, expect } from '@playwright/test';

test.describe('Mahjong Game Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the game with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Mahjong Shizen-Zho');
    await expect(page.locator('h1')).toHaveText('Mahjong Shizen-Zho');
  });

  test('should initialize game board with 18x8 grid', async ({ page }) => {
    const tiles = page.locator('.tile');
    await expect(tiles).toHaveCount(144); // 18 * 8 = 144 tiles
  });

  test('should show correct initial tile count', async ({ page }) => {
    await expect(page.locator('#tiles-remaining')).toHaveText('Tiles: 144');
  });

  test('should show initial timer', async ({ page }) => {
    await expect(page.locator('#timer')).toContainText('Time: 00:0');
  });

  test('should show solution status as available', async ({ page }) => {
    await expect(page.locator('#solution-status')).toHaveText('Solution: Available');
  });

  test('should have all control buttons present', async ({ page }) => {
    await expect(page.locator('#new-game')).toBeVisible();
    await expect(page.locator('#solve-game')).toBeVisible();
    await expect(page.locator('#pause-game')).toBeVisible();
    
    await expect(page.locator('#new-game')).toHaveText('New Game');
    await expect(page.locator('#solve-game')).toHaveText('Solve');
    await expect(page.locator('#pause-game')).toHaveText('Pause');
  });

  test('should display 36 different tile types with 4 copies each', async ({ page }) => {
    // Wait for tiles to be fully loaded
    await page.waitForTimeout(500);
    
    const tiles = await page.locator('.tile:not(.empty)').allTextContents();
    const tileCount = {};
    
    // Count each tile type
    tiles.forEach(tile => {
      if (tile.trim()) {
        tileCount[tile] = (tileCount[tile] || 0) + 1;
      }
    });
    
    // Should have exactly 36 different tile types
    expect(Object.keys(tileCount)).toHaveLength(36);
    
    // Each tile type should appear exactly 4 times
    Object.values(tileCount).forEach(count => {
      expect(count).toBe(4);
    });
  });

  test('should have tiles with mahjong unicode symbols', async ({ page }) => {
    const firstTile = page.locator('.tile:not(.empty)').first();
    const tileText = await firstTile.textContent();
    
    // Check if the tile contains a mahjong unicode symbol (starts with 🀇)
    expect(tileText).toMatch(/^🀇|🀈|🀉|🀊|🀋|🀌|🀍|🀎|🀏|🀐|🀑|🀒|🀓|🀔|🀕|🀖|🀗|🀘|🀙|🀚|🀛|🀜|🀝|🀞|🀟|🀠|🀡|🀢|🀣|🀤|🀥|🀦|🀧|🀨|🀩|🀪$/);
  });

  test('should start timer automatically', async ({ page }) => {
    const initialTime = await page.locator('#timer').textContent();
    
    // Wait for 2 seconds
    await page.waitForTimeout(2000);
    
    const updatedTime = await page.locator('#timer').textContent();
    expect(updatedTime).not.toBe(initialTime);
  });
});