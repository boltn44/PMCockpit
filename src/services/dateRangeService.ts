import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { DateRange } from '../types';

export const dateRangeService = {
  async getAll(): Promise<DateRange[]> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('date-ranges');
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading date ranges from localStorage:', error);
        return [];
      }
    }

    const { data, error } = await supabase
      .from('date_ranges')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getActive(): Promise<DateRange | null> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('date-ranges');
        const ranges = stored ? JSON.parse(stored) : [];
        return ranges.find((r: DateRange) => r.is_active) || null;
      } catch (error) {
        console.error('Error loading active date range from localStorage:', error);
        return null;
      }
    }

    const { data, error } = await supabase
      .from('date_ranges')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async create(dateRange: Omit<DateRange, 'id' | 'created_at' | 'updated_at'>): Promise<DateRange> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('date-ranges');
        const ranges = stored ? JSON.parse(stored) : [];
        
        // If this is being set as active, deactivate all others first
        if (dateRange.is_active) {
          ranges.forEach((r: DateRange) => r.is_active = false);
        }
        
        const newRange: DateRange = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          ...dateRange,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        ranges.push(newRange);
        localStorage.setItem('date-ranges', JSON.stringify(ranges));
        return newRange;
      } catch (error) {
        throw new Error('Failed to create date range');
      }
    }

    // If this is being set as active, deactivate all others first
    if (dateRange.is_active) {
      await this.deactivateAll();
    }

    const { data, error } = await supabase
      .from('date_ranges')
      .insert([dateRange])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<DateRange>): Promise<DateRange> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('date-ranges');
        const ranges = stored ? JSON.parse(stored) : [];
        
        // If this is being set as active, deactivate all others first
        if (updates.is_active) {
          ranges.forEach((r: DateRange) => r.is_active = false);
        }
        
        const index = ranges.findIndex((r: DateRange) => r.id === id);
        if (index === -1) {
          throw new Error('Date range not found');
        }
        
        ranges[index] = {
          ...ranges[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        
        localStorage.setItem('date-ranges', JSON.stringify(ranges));
        return ranges[index];
      } catch (error) {
        throw new Error('Failed to update date range');
      }
    }

    // If this is being set as active, deactivate all others first
    if (updates.is_active) {
      await this.deactivateAll();
    }

    const { data, error } = await supabase
      .from('date_ranges')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('date-ranges');
        const ranges = stored ? JSON.parse(stored) : [];
        const filtered = ranges.filter((r: DateRange) => r.id !== id);
        localStorage.setItem('date-ranges', JSON.stringify(filtered));
        
        // Also delete associated utilizations
        localStorage.removeItem(`utilizations-${id}`);
        return;
      } catch (error) {
        throw new Error('Failed to delete date range');
      }
    }

    const { error } = await supabase
      .from('date_ranges')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async setActive(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('date-ranges');
        const ranges = stored ? JSON.parse(stored) : [];
        
        // Deactivate all first
        ranges.forEach((r: DateRange) => r.is_active = false);
        
        // Then activate the selected one
        const range = ranges.find((r: DateRange) => r.id === id);
        if (range) {
          range.is_active = true;
          range.updated_at = new Date().toISOString();
        }
        
        localStorage.setItem('date-ranges', JSON.stringify(ranges));
        return;
      } catch (error) {
        throw new Error('Failed to set active date range');
      }
    }

    // Deactivate all first
    await this.deactivateAll();
    
    // Then activate the selected one
    const { error } = await supabase
      .from('date_ranges')
      .update({ is_active: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  async deactivateAll(): Promise<void> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('date-ranges');
        const ranges = stored ? JSON.parse(stored) : [];
        ranges.forEach((r: DateRange) => r.is_active = false);
        localStorage.setItem('date-ranges', JSON.stringify(ranges));
        return;
      } catch (error) {
        throw new Error('Failed to deactivate date ranges');
      }
    }

    const { error } = await supabase
      .from('date_ranges')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows
    
    if (error) throw error;
  }
};