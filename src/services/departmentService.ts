import { supabase } from '../lib/supabase';
import { Department } from '../types';

export const departmentService = {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async create(name: string): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert([{ name }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, name: string): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};