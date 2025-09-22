/*
  # Fix projects table RLS policy for public access

  1. Security Changes
    - Drop existing policy that may be misconfigured
    - Create new policy allowing all operations for public/anon users
    - Ensure RLS is enabled on projects table

  This ensures the demo application can migrate and manage project data
  without requiring Supabase authentication.
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create new policy allowing all operations for public users
CREATE POLICY "Enable all operations for public users" ON projects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);