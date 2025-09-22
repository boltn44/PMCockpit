import { supabase } from '../lib/supabase';
import { Resource } from '../types';

export const resourceService = {
  async getAll(): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        departments!inner(name)
      `)
      .order('name');
    
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      designation: item.designation,
      department: item.departments.name,
      availability: item.availability,
      status: item.status,
    }));
  },

  async create(resource: Omit<Resource, 'id'>): Promise<Resource> {
    // First, find the department ID by name
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', resource.department)
      .limit(1);
    
    if (deptError) throw deptError;
    if (!departments || departments.length === 0) {
      throw new Error(`Department "${resource.department}" not found`);
    }

    const { data, error } = await supabase
      .from('resources')
      .insert([{
        name: resource.name,
        designation: resource.designation,
        department_id: departments[0].id,
        availability: resource.availability,
        status: resource.status,
      }])
      .select(`
        *,
        departments!inner(name)
      `)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      designation: data.designation,
      department: data.departments.name,
      availability: data.availability,
      status: data.status,
    };
  },

  async update(id: string, updates: Partial<Resource>): Promise<Resource> {
    let updateData: any = {
      name: updates.name,
      designation: updates.designation,
      availability: updates.availability,
      status: updates.status,
    };

    // If department is being updated, find the department ID
    if (updates.department) {
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('name', updates.department)
        .limit(1);
      
      if (deptError) throw deptError;
      if (!departments || departments.length === 0) {
        throw new Error(`Department "${updates.department}" not found`);
      }
      updateData.department_id = departments[0].id;
    }

    const { data, error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        departments!inner(name)
      `)
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      designation: data.designation,
      department: data.departments.name,
      availability: data.availability,
      status: data.status,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async upsertMany(resources: Resource[]): Promise<void> {
    if (resources.length === 0) return;

    // Get all departments for mapping
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');
    
    if (deptError) throw deptError;
    
    const deptMap = new Map(departments?.map(d => [d.name, d.id]) || []);

    const records = resources.map(r => ({
      id: r.id,
      name: r.name,
      designation: r.designation,
      department_id: deptMap.get(r.department),
      availability: r.availability,
      status: r.status,
    })).filter(r => r.department_id); // Only include records with valid department

    if (records.length > 0) {
      const { error } = await supabase
        .from('resources')
        .upsert(records, { onConflict: 'id' });
      
      if (error) throw error;
    }
  }
};