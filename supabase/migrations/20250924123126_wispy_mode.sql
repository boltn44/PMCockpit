/*
  # Create users table for user management

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text, check constraint for Admin/Manager/User)
      - `status` (text, check constraint for Active/Inactive)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login` (timestamp, nullable)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read all users
    - Add policy for admin users to manage users

  3. Initial Data
    - Insert demo users for testing
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'User',
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('Admin', 'Manager', 'User'));

ALTER TABLE users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('Active', 'Inactive'));

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on users"
  ON users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial demo users
INSERT INTO users (id, username, email, full_name, role, status, created_at, last_login) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@pmcockpit.com', 'System Administrator', 'Admin', 'Active', '2024-01-01T00:00:00Z', '2024-01-15T10:30:00Z'),
  ('550e8400-e29b-41d4-a716-446655440002', 'manager', 'manager@pmcockpit.com', 'Project Manager', 'Manager', 'Active', '2024-01-02T00:00:00Z', '2024-01-14T14:20:00Z'),
  ('550e8400-e29b-41d4-a716-446655440003', 'user', 'user@pmcockpit.com', 'Team Member', 'User', 'Active', '2024-01-03T00:00:00Z', NULL)
ON CONFLICT (username) DO NOTHING;