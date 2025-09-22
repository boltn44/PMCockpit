/*
  # Fix RLS policy for resources table

  1. Security
    - Drop existing policy that may be misconfigured
    - Create new policy allowing all operations for public users
    - Ensure RLS is properly enabled
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on resources" ON resources;

-- Ensure RLS is enabled
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create a comprehensive policy for public access
CREATE POLICY "Enable all operations for public users"
  ON resources
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);