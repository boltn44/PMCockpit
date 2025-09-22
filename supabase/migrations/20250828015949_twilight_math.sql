/*
  # Add Date Ranges Table for Resource Utilization

  1. New Tables
    - `date_ranges`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Name/description of the date range
      - `start_date` (date) - Start date of the range
      - `end_date` (date) - End date of the range
      - `is_active` (boolean) - Whether this is the currently active date range
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `date_ranges` table
    - Add policies for all operations

  3. Changes
    - Update resource_utilizations table to reference date_range_id instead of single date
    - Add foreign key constraint
*/

-- Create date_ranges table
CREATE TABLE IF NOT EXISTS date_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE date_ranges ENABLE ROW LEVEL SECURITY;

-- Create policies for date_ranges
CREATE POLICY "Allow all operations on date_ranges"
  ON date_ranges
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_date_ranges_updated_at
  BEFORE UPDATE ON date_ranges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update resource_utilizations table to add date_range_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resource_utilizations' AND column_name = 'date_range_id'
  ) THEN
    ALTER TABLE resource_utilizations ADD COLUMN date_range_id uuid REFERENCES date_ranges(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the unique constraint to include date_range_id instead of date
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'resource_utilizations_resource_id_project_id_date_key'
  ) THEN
    ALTER TABLE resource_utilizations DROP CONSTRAINT resource_utilizations_resource_id_project_id_date_key;
  END IF;
  
  -- Add new constraint with date_range_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'resource_utilizations_resource_id_project_id_date_range_key'
  ) THEN
    ALTER TABLE resource_utilizations ADD CONSTRAINT resource_utilizations_resource_id_project_id_date_range_key 
      UNIQUE (resource_id, project_id, date_range_id);
  END IF;
END $$;