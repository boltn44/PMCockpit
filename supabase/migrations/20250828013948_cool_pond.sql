/*
  # Initial PM-Cockpit Database Schema

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `short_name` (text, unique)
      - `description` (text)
      - `status` (text, check constraint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `short_name` (text, unique)
      - `product_short_name` (text, foreign key)
      - `description` (text)
      - `status` (text, check constraint)
      - `business_owner` (text)
      - `customer` (text)
      - `po_status` (text, check constraint)
      - `start_date` (date)
      - `completion_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `resources`
      - `id` (uuid, primary key)
      - `name` (text)
      - `designation` (text)
      - `department_id` (uuid, foreign key)
      - `availability` (text, check constraint)
      - `status` (text, check constraint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `resource_utilizations`
      - `id` (uuid, primary key)
      - `resource_id` (uuid, foreign key)
      - `project_id` (uuid, foreign key)
      - `utilization` (integer, 0-100)
      - `date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text UNIQUE NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('Active', 'In-Active')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text UNIQUE NOT NULL,
  product_short_name text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('Active', 'In-Active')),
  business_owner text NOT NULL,
  customer text NOT NULL,
  po_status text NOT NULL CHECK (po_status IN ('PO', 'Non-PO')),
  start_date date NOT NULL,
  completion_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text NOT NULL,
  department_id uuid NOT NULL REFERENCES departments(id),
  availability text NOT NULL CHECK (availability IN ('Onshore', 'Offshore')),
  status text NOT NULL CHECK (status IN ('Active', 'In-Active')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resource_utilizations table
CREATE TABLE IF NOT EXISTS resource_utilizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  utilization integer NOT NULL CHECK (utilization >= 0 AND utilization <= 100),
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, project_id, date)
);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_utilizations ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Allow authenticated users to read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update departments"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete departments"
  ON departments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for products
CREATE POLICY "Allow authenticated users to manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for projects
CREATE POLICY "Allow authenticated users to manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for resources
CREATE POLICY "Allow authenticated users to manage resources"
  ON resources
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for resource_utilizations
CREATE POLICY "Allow authenticated users to manage resource utilizations"
  ON resource_utilizations
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default departments
INSERT INTO departments (name) VALUES
  ('Developer'),
  ('Mobile-App Developer'),
  ('Cloud Services Admin/DevOps'),
  ('UI/UX'),
  ('QA'),
  ('PM'),
  ('Tech Solution Lead'),
  ('SharePoint Developer'),
  ('Information Security'),
  ('Data Engineer')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resource_utilizations_updated_at BEFORE UPDATE ON resource_utilizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();