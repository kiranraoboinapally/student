/*
  # Password Reset Tokens Table

  1. New Tables
    - `password_reset_tokens`
      - `id` (int, primary key, auto increment)
      - `user_id` (int, foreign key to users)
      - `email` (varchar, indexed)
      - `token` (varchar, unique, indexed)
      - `expires_at` (timestamp)
      - `used` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Tokens expire after 1 hour
    - Tokens can only be used once
    - Old tokens are marked as used when new ones are generated
*/

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
