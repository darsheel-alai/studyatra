import { Pool } from "pg";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection
pool.on("connect", () => {
  console.log("Connected to Neon database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Initialize database tables
export async function initDatabase() {
  try {
    // Create chat_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        class_value VARCHAR(10) NOT NULL,
        board VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        last_message TEXT,
        message_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chat_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        image_url TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_class_board 
      ON chat_sessions(user_id, class_value, board)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id 
      ON chat_messages(session_id)
    `);

    // Create notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        class_value VARCHAR(10) NOT NULL,
        board VARCHAR(50) NOT NULL,
        subject VARCHAR(100),
        topic VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for notes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_class_board 
      ON notes(user_id, class_value, board)
    `);

    // Create timetable table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        class_value VARCHAR(10) NOT NULL,
        board VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        schedule JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for timetables
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_timetables_user_class_board 
      ON timetables(user_id, class_value, board)
    `);

    // Create user_stats table for XP, streaks, and leaderboard
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id VARCHAR(255) PRIMARY KEY,
        total_xp INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_activity_date DATE,
        games_played_today INTEGER DEFAULT 0,
        last_game_date DATE,
        tests_completed INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        total_test_score INTEGER DEFAULT 0,
        total_quiz_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create daily_game_plays table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_game_plays (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        game_id VARCHAR(255) NOT NULL,
        played_date DATE NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, game_id, played_date)
      )
    `);

    // Create test_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        class_value VARCHAR(10) NOT NULL,
        board VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        topic VARCHAR(255),
        test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('test', 'quiz')),
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score INTEGER NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        time_taken INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_game_plays_user_date 
      ON daily_game_plays(user_id, played_date)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_test_results_user 
      ON test_results(user_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_stats_xp 
      ON user_stats(total_xp DESC)
    `);

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export default pool;
