/*
  # Fix RLS policy for resources table

  1. Security Changes
    - Drop the restrictive policy that requires authenticated users
    - Create a new public policy that allows all operations for public users
    - This matches the pattern used by other tables in the system

  This ensures that resource data can be migrated and managed successfully 
  while maintaining the same access pattern as the rest of the application.
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage resources" ON resources;

-- Create a new public policy that allows all operations
CREATE POLICY "Allow all operations on resources"
  ON resources
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);