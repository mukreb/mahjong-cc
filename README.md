# 🎮 Mahjong Shizen-Zho

A modern web-based implementation of the classic Mahjong Solitaire puzzle game with both single-player and multiplayer modes.

## 🌐 Play Online

**[Play Mahjong Shizen-Zho Live](https://mukreb.github.io/mahjong-cc/)**

## 📖 About

Mahjong Shizen-Zho is a tile-matching puzzle game where the goal is to remove all tiles from an 18×8 grid. Each tile appears four times on the board, and you must find matching pairs that can be connected with three or fewer line segments without crossing other tiles.

## 🎯 Game Rules

- **Objective**: Remove all 144 tiles from the board by matching identical pairs
- **Matching**: Click two tiles with the same symbol to remove them
- **Connection Rules**: Tiles can only be matched if they can be connected by:
  - A straight line
  - Two line segments (L-shape)
  - Three line segments (Z-shape)
- **Path Restrictions**: Connection lines cannot pass through other tiles
- **Special Feature**: Lines can extend beyond the board edges for easier connectivity

## ✨ Features

### 🎮 Game Modes
- **Single Player**: Race against time with high score tracking
- **Multiplayer**: Compete with other players in real-time

### 🎨 User Interface
- **Visual Feedback**: Animated connection lines show tile relationships
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Game Statistics**: Track remaining tiles, available connections, and time
- **Solution Status**: Real-time indication of puzzle solvability

### 🛠 Game Controls
- **New Game**: Start a fresh puzzle
- **Solve**: Remove one matching pair automatically
- **Auto Solve**: Hold to rapidly solve the entire puzzle
- **Pause/Resume**: Pause the game and timer
- **Timer**: Track completion time

### 🏆 Scoring System
- **High Scores**: Top 10 leaderboard for single-player mode
- **Multiplayer Scoring**: Compete for most tiles removed
- **Time Tracking**: See how fast you can complete puzzles

## 🎲 Game Generation

The game uses an innovative **reverse construction algorithm** to ensure every puzzle is solvable:

1. **Guaranteed Solvability**: Every generated board can be completed
2. **Smart Placement**: Tiles are placed using connectivity priority
3. **Edge Optimization**: Corner and edge positions prioritized for better gameplay
4. **Randomization**: Each game offers a unique challenge

## 🚀 Technical Stack

- **Frontend**: Pure HTML5, CSS3, and JavaScript
- **Testing**: Playwright for comprehensive end-to-end testing
- **Backend**: Supabase integration for multiplayer and high scores
- **Deployment**: GitHub Pages with automated CI/CD
- **Graphics**: Custom tile images for authentic Mahjong experience

## 🎨 Tile Set

The game features 36 different tile types including:
- **Bamboo tiles** (1-9)
- **Circle tiles** (1-9) 
- **Character tiles** (1-15)
- **Season tiles** (Spring, Summer, Fall, Winter)
- **Flower tiles** (Chrysanthemum, Lotus, Orchid, Peony)

## 🎪 Screenshots

*Game in action showing tile matching with connection visualization*

## 🏗 Development

### Prerequisites
- Node.js (for development and testing)
- Modern web browser

### Local Development
```bash
# Clone the repository
git clone https://github.com/mukreb/mahjong-cc.git
cd mahjong-cc

# Install dependencies
npm install

# Configure Supabase (optional - for multiplayer features)
cp config.example.js config.js
# Edit config.js with your Supabase credentials

# Start local server
python3 -m http.server 8000
# or
npx serve .

# Run tests
npm test
```

### Testing
The project includes comprehensive test coverage:
- **Game Logic Tests**: Tile matching, path finding, game states
- **UI Tests**: User interactions, visual feedback, responsive design
- **Integration Tests**: Complete game workflows
- **Cross-browser Tests**: Chrome, Firefox, Safari compatibility

```bash
# Run all tests
npm test

# Run tests in headed mode
npm run test:headed

# Run tests with UI
npm run test:ui
```

## 🔧 Configuration

### Supabase Integration
For multiplayer functionality and high scores, configure Supabase:

#### Local Development
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up the database schema (see `supabase-setup.md`)
3. Copy your credentials:
   ```bash
   cp config.example.js config.js
   ```
4. Edit `config.js` with your actual Supabase URL and anon key

#### Production Deployment
Configure GitHub Secrets for automatic deployment:
1. Go to your GitHub repository Settings → Secrets and variables → Actions
2. Add these secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon/public key

The GitHub Actions workflow will automatically create the config file during deployment.

### Deployment
The project automatically deploys to GitHub Pages on every push to the main branch via GitHub Actions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for:
- Bug fixes
- New features
- Performance improvements
- UI/UX enhancements
- Additional tile sets
- Game variations

## 📄 License

This project is open source and available under the ISC License.

## 🙏 Acknowledgments

- Classic Mahjong Solitaire game design
- Tile graphics inspired by traditional Mahjong sets
- Modern web technologies for smooth gameplay experience

## 🎯 Future Enhancements

- [ ] Additional tile themes
- [ ] Sound effects and music
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Tournament mode
- [ ] Social features
- [ ] Mobile app versions

---

**Enjoy playing Mahjong Shizen-Zho!** 🀄

*Built with ❤️ using modern web technologies*