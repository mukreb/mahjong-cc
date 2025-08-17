# Mahjong Shizen-Zho Playwright Tests

This test suite provides comprehensive testing for the Mahjong Shizen-Zho game using Playwright.

## Test Coverage

### 1. Game Initialization (`game-initialization.test.js`)
- ✅ Correct game title and header
- ✅ 18x8 grid with 144 tiles total
- ✅ 36 different tile types, 4 copies each
- ✅ Mahjong unicode symbols
- ✅ Initial UI state (timer, tile count, solution status)
- ✅ All control buttons present
- ✅ Auto-start timer

### 2. Tile Matching (`tile-matching.test.js`) 
- ✅ Tile selection/deselection
- ✅ Valid match detection and removal
- ✅ Invalid match error handling
- ✅ Tile counter updates
- ✅ Success/error message display
- ✅ Connection line visualization
- ✅ Selection clearing after matches

### 3. Game Controls (`game-controls.test.js`)
- ✅ **New Game**: Resets all game state, clears selections, resets timer
- ✅ **Solve Button**: Step-by-step solving with animation, enables/disables correctly
- ✅ **Pause/Resume**: Timer pausing, prevents interactions during pause
- ✅ Solution status updates based on available moves

### 4. Timer Functionality (`timer-functionality.test.js`)
- ✅ Auto-start on game load
- ✅ MM:SS format display
- ✅ Proper time increments
- ✅ Pause/resume functionality
- ✅ Reset on new game
- ✅ Continues during matches and solve animations
- ✅ Stops on game completion
- ✅ Minute rollover handling

### 5. Visual Feedback (`visual-feedback.test.js`)
- ✅ **Tile Selection**: Hover effects, selection highlighting
- ✅ **Connection Lines**: Horizontal/vertical lines, proper positioning, green color
- ✅ **Messages**: Success/error messages with proper styling and auto-clear
- ✅ **Empty Tiles**: Different styling for removed tiles
- ✅ Animation timing and cleanup

## Running the Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run with Browser UI (recommended for development)
```bash
npm run test:headed
```

### Interactive Test Runner
```bash
npm run test:ui
```

### Debug Mode (step through tests)
```bash
npm run test:debug
```

### Run Specific Test File
```bash
npx playwright test tests/game-initialization.test.js
```

### Run Tests in Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Features

### Shizen-Zho Rule Validation
- ✅ Tests the 3-line connection rule (direct, 1-corner, 2-corner connections)
- ✅ Validates path-finding logic for tile connections
- ✅ Ensures tiles can only connect with matching symbols
- ✅ Tests line visualization shows actual connection path

### Game State Management
- ✅ Proper state transitions (playing → paused → resumed)
- ✅ Game reset functionality
- ✅ Win condition detection
- ✅ Solution availability tracking

### User Interface Testing
- ✅ Responsive tile interactions
- ✅ Visual feedback for all user actions
- ✅ Timer display and functionality
- ✅ Message system for user feedback
- ✅ Button state management (enabled/disabled)

### Performance Considerations
- ✅ Tests are optimized to run quickly
- ✅ Helper functions to efficiently find matching tiles
- ✅ Timeouts tuned for game animations
- ✅ Limited tile scanning for performance

## Configuration

The tests are configured to:
- Run across Chrome, Firefox, and Safari
- Start a local development server automatically
- Generate HTML reports
- Record traces on first retry
- Run in parallel for faster execution

## Browser Requirements

The test suite automatically handles browser installation. On first run, Playwright will download the required browser binaries.

## Troubleshooting

### Tests failing on first run?
- Ensure the local server starts correctly (check port 3000 is available)
- Run `npx playwright install` if browsers aren't downloading

### Slow test execution?
- Tests include necessary waits for game animations
- Use `--workers=1` to run tests sequentially if needed

### Visual differences between browsers?
- Some styling tests may behave differently across browsers
- This is expected and tests are designed to handle browser variations