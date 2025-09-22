/*
  # Fix RLS policy for resource_utilizations table

  1. Security Changes
    - Update RLS policy to allow public access for all operations
    - This matches the pattern used by other tables in the system
    - Ensures compatibility with the demo authentication system

  2. Changes Made
    - Drop existing authenticated-only policy
    - Add new public access policy for all CRUD operations
*/

-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "Allow authenticated users to manage resource utilizations" ON resource_utilizations;

-- Add new policy that allows public access (matching other tables)
CREATE POLICY "Allow all operations on resource_utilizations"
  ON resource_utilizations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);