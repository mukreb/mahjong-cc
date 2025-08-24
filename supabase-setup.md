# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from the project settings

## 2. Create Database Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Create the mahjong_highscores table
CREATE TABLE mahjong_highscores (
  id BIGSERIAL PRIMARY KEY,
  player_name VARCHAR(20) NOT NULL,
  completion_time INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_mahjong_highscores_completion_time ON mahjong_highscores(completion_time);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE mahjong_highscores ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Anyone can view highscores" ON mahjong_highscores
  FOR SELECT USING (true);

-- Create policy to allow public insert
CREATE POLICY "Anyone can insert highscores" ON mahjong_highscores
  FOR INSERT WITH CHECK (true);
```

## 3. Configure Application
In `script.js`, replace the placeholders in the `SupabaseManager` constructor:

```javascript
this.SUPABASE_URL = 'YOUR_ACTUAL_SUPABASE_URL_HERE';
this.SUPABASE_ANON_KEY = 'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE';
```

## 4. Test the Integration
1. Open the game in your browser
2. Complete a game
3. Save your highscore
4. Check that it appears in the leaderboard
5. Verify in your Supabase dashboard that the record was saved

## Fallback Mode
If Supabase credentials are not configured, the application will automatically fall back to using localStorage to store highscores locally in the browser.

## Database Schema
- `id`: Primary key (auto-increment)
- `player_name`: Player name (max 20 characters)
- `completion_time`: Time in seconds to complete the puzzle
- `completed_at`: Timestamp when the game was completed
- `created_at`: Timestamp when the record was created