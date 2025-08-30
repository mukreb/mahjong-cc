# Shizen-Sho Mahjong game
- This is a Shizen-zho Mahjong game
- The aim of the puzzle is to remove all the tiles from an 18x8  grid containing 36 different tiles, each duplicated four times.

# Technology
- Webbased
- Plain javascript & HTML
- Testcases using Playwright
- Backend using supabase
 - name: Mahjong-cc
 - project ID: mhwhsilpkesykgtfvecu

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
- The UI should also work on tablet resolutions and mobile resolutions

# Game setup
- When creating a new board, it should always be possible to finish the game
- Creating the board:
 - Start with an empty board
 - Place 2 tiles that are connectable with eachother
 - Add 2 new tiles that are connectable
 - Continue the cycle until the board is filled
 - When not possible to add 2 new tiles, backtrack and try another position. Do multiple backtracks in a row when needed

# Game modes
- There are 2 game modes; single player and multiplayer mode
- Single player:
    - The player plays solo
    - there is a top 10 highscores. 
    - The highscores are calculated in time, how fast you have finished the game
- Multiplayer:
    - After starting a game, the real game doesnt start yet 
    - The user is in a waiting room with a generated name
    - The user can see other rooms where other players are waiting
    - The user can join another room, or wait for a player to join his/her room
    - After a room has 2 players, the 'start game' option is enabled, and when that is pressed by both players the players start the game, the game room is now locked
    - The player that removes the most tiles before the game finishes, wins the game
    - When there are no more tiles, or no more connectable tiles, the game finishes
