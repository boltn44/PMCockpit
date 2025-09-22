import { supabase } from '../lib/supabase';
import { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      shortName: item.short_name,
      description: item.description,
      status: item.status,
    }));
  },

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        short_name: product.shortName,
        description: product.description,
        status: product.status,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      shortName: data.short_name,
      description: data.description,
      status: data.status,
    };
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.shortName !== undefined) updateData.short_name = updates.shortName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      shortName: data.short_name,
      description: data.description,
      status: data.status,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async upsertMany(products: Product[]): Promise<void> {
    if (products.length === 0) return;

    const records = products.map(p => ({
      id: p.id,
      name: p.name,
      short_name: p.shortName,
      description: p.description,
      status: p.status,
    }));

    const { error } = await supabase
      .from('products')
      .upsert(records, { onConflict: 'id' });
    
    if (error) throw error;
  }
};