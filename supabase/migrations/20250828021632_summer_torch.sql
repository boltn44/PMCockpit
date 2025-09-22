/*
  # Fix RLS policy for products table

  1. Security Changes
    - Drop existing restrictive policy that requires authenticated users
    - Add new policy allowing all operations for public users
    - Matches the pattern used by departments and date_ranges tables

  This ensures the demo authentication system can work with the products table.
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON products;

-- Create new policy allowing all operations for public users
CREATE POLICY "Allow all operations on products"
  ON products
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);