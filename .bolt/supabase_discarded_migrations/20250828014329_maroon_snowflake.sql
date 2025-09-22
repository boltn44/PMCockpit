@@ .. @@
 -- Enable RLS on all tables
 ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
 ALTER TABLE products ENABLE ROW LEVEL SECURITY;
 ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
 ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
 ALTER TABLE resource_utilizations ENABLE ROW LEVEL SECURITY;
 
 -- Create RLS policies for departments
-CREATE POLICY "Allow authenticated users to read departments" ON departments FOR SELECT TO authenticated USING (true);
-CREATE POLICY "Allow authenticated users to insert departments" ON departments FOR INSERT TO authenticated WITH CHECK (true);
-CREATE POLICY "Allow authenticated users to update departments" ON departments FOR UPDATE TO authenticated USING (true);
-CREATE POLICY "Allow authenticated users to delete departments" ON departments FOR DELETE TO authenticated USING (true);
+CREATE POLICY "Allow authenticated users to read departments" ON departments FOR SELECT USING (auth.role() = 'authenticated');
+CREATE POLICY "Allow authenticated users to insert departments" ON departments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
+CREATE POLICY "Allow authenticated users to update departments" ON departments FOR UPDATE USING (auth.role() = 'authenticated');
+CREATE POLICY "Allow authenticated users to delete departments" ON departments FOR DELETE USING (auth.role() = 'authenticated');
 
 -- Create RLS policies for products
-CREATE POLICY "Allow authenticated users to manage products" ON products FOR ALL TO authenticated USING (true);
+CREATE POLICY "Allow authenticated users to manage products" ON products FOR ALL USING (auth.role() = 'authenticated');
 
 -- Create RLS policies for projects
-CREATE POLICY "Allow authenticated users to manage projects" ON projects FOR ALL TO authenticated USING (true);
+CREATE POLICY "Allow authenticated users to manage projects" ON projects FOR ALL USING (auth.role() = 'authenticated');
 
 -- Create RLS policies for resources
-CREATE POLICY "Allow authenticated users to manage resources" ON resources FOR ALL TO authenticated USING (true);
+CREATE POLICY "Allow authenticated users to manage resources" ON resources FOR ALL USING (auth.role() = 'authenticated');
 
 -- Create RLS policies for resource_utilizations
-CREATE POLICY "Allow authenticated users to manage resource utilizations" ON resource_utilizations FOR ALL TO authenticated USING (true);