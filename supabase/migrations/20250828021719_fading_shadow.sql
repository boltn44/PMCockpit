/*
  # Fix projects table RLS policy

  1. Security Changes
    - Drop existing restrictive policy that requires authenticated users
    - Add new policy allowing all operations for public users
    - Matches pattern used by other tables (departments, products, etc.)
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage projects" ON projects;

-- Create a new policy that allows all operations for public users
CREATE POLICY "Allow all operations on projects"
  ON projects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);