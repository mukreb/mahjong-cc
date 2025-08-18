# Shizen-Sho Mahjong game
- This is a Shizen-zho Mahjong game
- The aim of the puzzle is to remove all the tiles from an 18x8  grid containing 36 different tiles, each duplicated four times.

# Rules
- The player can remove matching pairs of tiles where a matched pair has the same face and can be connected by three or less lines. 
- The lines cannot pass over another tile but can extend beyond the border of the grid.

# User Interface
- Show the number of tiles that can be connected at the current state of the game
- Show the number of tiles still left to finish the game
- Show 'solve' button that solves the shizen-zho step by step, which you visually can track. do not disable solve when showing a step, so the player can really fast finish the game by pressing solve multiple times in short order
- Show 'new game' to start a whole new game
- Show 'pause'
- Show a timer to see how fast you are solving the puzzle
- When clicking on 2 tiles that can be removed, show an elbow connector line that shows connection between the 2 tiles. The line should not cross other tiles
- When finishing the game, congratulate the gamer, also show the total time to finish the game. 

# Game setup
- When creating a new board, it should always be possible to finish the game
- Place the tiles randomly across the board where possible, while still make the game finishable