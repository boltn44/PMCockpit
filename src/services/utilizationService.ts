import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { ResourceUtilization } from '../types';

export const utilizationService = {
  async getByDateRange(dateRangeId: string): Promise<ResourceUtilization[]> {
    console.log('Loading utilizations for dateRangeId:', dateRangeId);
    
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const key = `utilizations-${dateRangeId}`;
        console.log('Loading from localStorage key:', key);
        const stored = localStorage.getItem(key);
        console.log('Raw stored data:', stored);
        const result = stored ? JSON.parse(stored) : [];
        console.log('Parsed utilizations from localStorage:', result);
        return result;
      } catch (error) {
        console.error('Error loading utilizations from localStorage:', error);
        return [];
      }
    }

    const { data, error } = await supabase
      .from('resource_utilizations')
      .select(`
        *,
        projects!inner(name, short_name)
      `)
      .eq('date_range_id', dateRangeId);
    
    if (error) throw error;
    return (data || []).map(item => ({
      resourceId: item.resource_id,
      projectId: item.project_id,
      projectName: item.projects.name,
      projectShortName: item.projects.short_name,
      utilization: item.utilization,
      dateRangeId: item.date_range_id,
    }));
  },

  async upsert(utilization: ResourceUtilization, projectName?: string, projectShortName?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        const key = `utilizations-${utilization.dateRangeId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const index = existing.findIndex((u: ResourceUtilization) => 
          u.resourceId === utilization.resourceId && u.projectId === utilization.projectId
        );
        
        if (index >= 0) {
          existing[index] = utilization;
        } else {
          existing.push(utilization);
        }
        
        localStorage.setItem(key, JSON.stringify(existing));
        return;
      } catch (error) {
        throw new Error('Failed to save utilization data');
      }
    }

    const { error } = await supabase
      .from('resource_utilizations')
      .upsert({
        resource_id: utilization.resourceId,
        project_id: utilization.projectId,
        utilization: utilization.utilization,
        date_range_id: utilization.dateRangeId,
        date: new Date().toISOString().split('T')[0], // Keep for compatibility
      }, {
        onConflict: 'resource_id,project_id,date_range_id'
      });
    
    if (error) throw error;
  },

  async batchUpsert(utilizations: ResourceUtilization[], projectsMap?: Map<string, {name: string, shortName: string}>): Promise<void> {
    if (utilizations.length === 0) return;

    console.log('batchUpsert called with:', utilizations);
    console.log('isSupabaseConfigured:', isSupabaseConfigured);
    
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        console.log('Using localStorage fallback');
        // Validate utilizations before saving
        const validUtilizations = utilizations.filter(u => 
          u.resourceId && u.projectId && u.dateRangeId && 
          typeof u.utilization === 'number' && u.utilization >= 0
        );
        console.log('Valid utilizations after filtering:', validUtilizations);
        
        if (validUtilizations.length === 0) {
          console.warn('No valid utilizations to save');
          return;
        }
        
        // Group by dateRangeId
        const groupedByDateRange = validUtilizations.reduce((acc, util) => {
          if (!acc[util.dateRangeId]) {
            acc[util.dateRangeId] = [];
          }
          acc[util.dateRangeId].push(util);
          return acc;
        }, {} as Record<string, ResourceUtilization[]>);

        console.log('Grouped by date range:', groupedByDateRange);
        // Save each group
        for (const [dateRangeId, utils] of Object.entries(groupedByDateRange)) {
          console.log(`Saving utilizations for date range ${dateRangeId}:`, utils);
          const key = `utilizations-${dateRangeId}`;
          let existing: ResourceUtilization[] = [];
          try {
            existing = JSON.parse(localStorage.getItem(key) || '[]');
            console.log('Existing utilizations:', existing);
          } catch (parseError) {
            console.warn('Error parsing existing utilizations, starting fresh:', parseError);
            existing = [];
          }
          
          // Update or add each utilization
          utils.forEach(util => {
            console.log('Processing utilization:', util);
            const index = existing.findIndex((u: ResourceUtilization) => 
              u.resourceId === util.resourceId && u.projectId === util.projectId
            );
            
            if (index >= 0) {
              console.log('Updating existing utilization at index:', index);
              existing[index] = util;
            } else {
              console.log('Adding new utilization');
              existing.push(util);
            }
          });
          
          console.log('Final utilizations to save:', existing);
          localStorage.setItem(key, JSON.stringify(existing));
          console.log('Saved to localStorage successfully');
        }
        return;
      } catch (error) {
        console.error('localStorage save error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw new Error(`Failed to save utilization data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('Using Supabase for utilization data');
    // Validate utilizations before sending to Supabase
    const validUtilizations = utilizations.filter(u => 
      u.resourceId && u.projectId && u.dateRangeId && 
      typeof u.utilization === 'number' && u.utilization >= 0
    );
    
    if (validUtilizations.length === 0) {
      console.warn('No valid utilizations to save');
      return;
    }
    
    const records = validUtilizations.map(u => ({
      resource_id: u.resourceId,
      project_id: u.projectId,
      utilization: u.utilization,
      date_range_id: u.dateRangeId,
      date: new Date().toISOString().split('T')[0], // Keep for compatibility
    }));

    const { error } = await supabase
      .from('resource_utilizations')
      .upsert(records, {
        onConflict: 'resource_id,project_id,date_range_id'
      });
    
    if (error) throw error;
  },

  async deleteByDateRange(dateRangeId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage
      try {
        localStorage.removeItem(`utilizations-${dateRangeId}`);
        return;
      } catch (error) {
        throw new Error('Failed to delete utilization data');
      }
    }

    const { error } = await supabase
      .from('resource_utilizations')
      .delete()
      .eq('date_range_id', dateRangeId);
    
    if (error) throw error;
  }
};