import { supabase } from '../lib/supabase';
import { Project } from '../types';

export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      shortName: item.short_name,
      productShortName: item.product_short_name,
      description: item.description,
      status: item.status,
      businessOwner: item.business_owner,
      customer: item.customer,
      poStatus: item.po_status,
      startDate: item.start_date,
      completionDate: item.completion_date,
    }));
  },

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: project.name,
        short_name: project.shortName,
        product_short_name: project.productShortName,
        description: project.description,
        status: project.status,
        business_owner: project.businessOwner,
        customer: project.customer,
        po_status: project.poStatus,
        start_date: project.startDate,
        completion_date: project.completionDate,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      shortName: data.short_name,
      productShortName: data.product_short_name,
      description: data.description,
      status: data.status,
      businessOwner: data.business_owner,
      customer: data.customer,
      poStatus: data.po_status,
      startDate: data.start_date,
      completionDate: data.completion_date,
    };
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.shortName !== undefined) updateData.short_name = updates.shortName;
    if (updates.productShortName !== undefined) updateData.product_short_name = updates.productShortName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.businessOwner !== undefined) updateData.business_owner = updates.businessOwner;
    if (updates.customer !== undefined) updateData.customer = updates.customer;
    if (updates.poStatus !== undefined) updateData.po_status = updates.poStatus;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.completionDate !== undefined) updateData.completion_date = updates.completionDate;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      shortName: data.short_name,
      productShortName: data.product_short_name,
      description: data.description,
      status: data.status,
      businessOwner: data.business_owner,
      customer: data.customer,
      poStatus: data.po_status,
      startDate: data.start_date,
      completionDate: data.completion_date,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async upsertMany(projects: Project[]): Promise<void> {
    if (projects.length === 0) return;

    const records = projects.map(p => ({
      id: p.id,
      name: p.name,
      short_name: p.shortName,
      product_short_name: p.productShortName,
      description: p.description,
      status: p.status,
      business_owner: p.businessOwner,
      customer: p.customer,
      po_status: p.poStatus,
      start_date: p.startDate,
      completion_date: p.completionDate,
    }));

    const { error } = await supabase
      .from('projects')
      .upsert(records, { onConflict: 'id' });
    
    if (error) throw error;
  }
};