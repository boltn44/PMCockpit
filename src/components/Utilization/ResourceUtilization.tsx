import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, Plus, Save, Edit, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { Resource, Project, ResourceUtilization, DateRange } from '../../types';
import { dateRangeService } from '../../services/dateRangeService';
import { utilizationService } from '../../services/utilizationService';
import { useToast } from '../../contexts/ToastContext';

interface ResourceUtilizationProps {
  resources: Resource[];
  projects: Project[];
}

export function ResourceUtilizationManager({ resources, projects }: ResourceUtilizationProps) {
  const { showSuccess, showError } = useToast();
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [activeDateRange, setActiveDateRange] = useState<DateRange | null>(null);
  const [utilizations, setUtilizations] = useState<ResourceUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<DateRange | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; range: DateRange | null }>({ show: false, range: null });
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  const activeResources = resources.filter(r => r.status === 'Active');
  const activeProjects = projects.filter(p => p.status === 'Active');

  useEffect(() => {
    loadDateRanges();
  }, []);

  useEffect(() => {
    if (activeDateRange) {
      loadUtilizations(activeDateRange.id);
    }
  }, [activeDateRange]);

  const loadDateRanges = async () => {
    try {
      setLoading(true);
      const ranges = await dateRangeService.getAll();
      setDateRanges(ranges);
      
      const active = await dateRangeService.getActive();
      setActiveDateRange(active);
    } catch (error) {
      console.error('Error loading date ranges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUtilizations = async (dateRangeId: string) => {
    try {
      console.log('loadUtilizations called for dateRangeId:', dateRangeId);
      const data = await utilizationService.getByDateRange(dateRangeId);
      console.log('Loaded utilizations data:', data);
      setUtilizations(data);
    } catch (error) {
      console.error('Error loading utilizations:', error);
      // Don't clear utilizations on error, keep existing data
    }
  };

  const handleSubmitDateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRange) {
        await dateRangeService.update(editingRange.id, formData);
      } else {
        await dateRangeService.create(formData);
      }
      
      await loadDateRanges();
      resetForm();
      showSuccess(
        editingRange ? 'Date Range Updated' : 'Date Range Created',
        `${formData.name} has been ${editingRange ? 'updated' : 'created'} successfully.`
      );
    } catch (error) {
      console.error('Error saving date range:', error);
      showError('Error Saving Date Range', 'Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', start_date: '', end_date: '', is_active: false });
    setEditingRange(null);
    setIsFormOpen(false);
  };

  const handleEditRange = (range: DateRange) => {
    setEditingRange(range);
    setFormData({
      name: range.name,
      start_date: range.start_date,
      end_date: range.end_date,
      is_active: range.is_active,
    });
    setIsFormOpen(true);
  };

  const handleDeleteRange = async (id: string) => {
    const rangeToDelete = dateRanges.find(r => r.id === id);
    if (rangeToDelete) {
      setDeleteConfirm({ show: true, range: rangeToDelete });
    }
  };

  const confirmDeleteRange = async () => {
    if (!deleteConfirm.range) return;
    
    try {
      await dateRangeService.delete(deleteConfirm.range.id);
      await loadDateRanges();
      if (activeDateRange?.id === deleteConfirm.range.id) {
        setActiveDateRange(null);
        setUtilizations([]);
      }
      showSuccess('Date Range Deleted', `${deleteConfirm.range.name} has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting date range:', error);
      showError('Error Deleting Date Range', 'Please try again.');
    } finally {
      setDeleteConfirm({ show: false, range: null });
    }
  };

  const cancelDeleteRange = () => {
    setDeleteConfirm({ show: false, range: null });
  };

  const handleSetActive = async (id: string) => {
    try {
      await dateRangeService.setActive(id);
      await loadDateRanges();
      const rangeName = dateRanges.find(r => r.id === id)?.name || 'Date range';
      showSuccess('Active Date Range Set', `${rangeName} is now the active date range.`);
    } catch (error) {
      console.error('Error setting active date range:', error);
      showError('Error Setting Active Date Range', 'Please try again.');
    }
  };

  const getUtilization = (resourceId: string, projectId: string): number => {
    const util = utilizations.find(u => u.resourceId === resourceId && u.projectId === projectId);
    return util?.utilization || 0;
  };

  const updateUtilization = (resourceId: string, projectId: string, value: number) => {
    if (!activeDateRange) return;

    const project = activeProjects.find(p => p.id === projectId);
    if (!project) return;

    setUtilizations(prev => {
      const existing = prev.find(u => u.resourceId === resourceId && u.projectId === projectId);
      if (existing) {
        return prev.map(u => 
          u.resourceId === resourceId && u.projectId === projectId 
            ? { ...u, utilization: value, projectName: project.name, projectShortName: project.shortName }
            : u
        );
      } else {
        return [...prev, {
          resourceId,
          projectId,
          projectName: project.name,
          projectShortName: project.shortName,
          utilization: value,
          dateRangeId: activeDateRange.id,
        }];
      }
    });
  };

  const saveUtilizations = async () => {
    if (!activeDateRange) return;

    try {
      setSaving(true);
      
      console.log('Starting save utilizations...');
      console.log('Active date range:', activeDateRange);
      console.log('Current utilizations:', utilizations);
      console.log('Active resources:', activeResources.length);
      console.log('Active projects:', activeProjects.length);
      
      // Filter out utilizations with 0 values to avoid saving empty data
      const validUtilizations = utilizations.filter(u => u.utilization > 0);
      console.log('Valid utilizations to save:', validUtilizations);
      
      if (validUtilizations.length === 0) {
        console.log('No utilizations to save');
        showSuccess('Utilizations Saved', 'No utilization data to save.');
        return;
      }
      
      console.log('Calling batchUpsert with:', validUtilizations);
      await utilizationService.batchUpsert(validUtilizations);
      console.log('Save completed successfully');
      showSuccess('Utilizations Saved', 'All resource utilizations have been saved successfully.');
    } catch (error) {
      console.error('Error saving utilizations:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        utilizations: utilizations,
        activeDateRange: activeDateRange
      });
      showError('Error Saving Utilizations', `${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setSaving(false);
    }
  };

  const getResourceTotal = (resourceId: string): number => {
    return utilizations
      .filter(u => u.resourceId === resourceId)
      .reduce((sum, u) => sum + u.utilization, 0);
  };

  const getProjectTotal = (projectId: string): number => {
    return utilizations
      .filter(u => u.projectId === projectId)
      .reduce((sum, u) => sum + u.utilization, 0);
  };

  const getUtilizationColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100 text-gray-600';
    if (value <= 25) return 'bg-red-100 text-red-800';
    if (value <= 50) return 'bg-yellow-100 text-yellow-800';
    if (value <= 75) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-amber-600" />
            Resource Utilization
          </h1>
          <p className="text-gray-600 mt-2">Track resource allocation across projects by date range</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Date Range
          </button>
          
          {activeDateRange && utilizations.length > 0 && (
            <button
              onClick={saveUtilizations}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Utilizations'}
            </button>
          )}
        </div>
      </div>

      {/* Date Range Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Date Range Management
        </h2>
        
        <div className="space-y-3">
          {dateRanges.map((range) => (
            <div key={range.id} className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              range.is_active ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{range.name}</h3>
                    {range.is_active && (
                      <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(range.start_date).toLocaleDateString()} - {new Date(range.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!range.is_active && (
                  <button
                    onClick={() => handleSetActive(range.id)}
                    className="text-amber-600 hover:text-amber-800 p-1 rounded transition-colors"
                    title="Set as active"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEditRange(range)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRange(range.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {dateRanges.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No date ranges found. Create your first date range to start tracking utilization.
            </div>
          )}
        </div>
      </div>

      {/* Date Range Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingRange ? 'Edit Date Range' : 'Add New Date Range'}
            </h2>
            
            <form onSubmit={handleSubmitDateRange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Range Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., Q1 2024, January 2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                  Set as active date range
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingRange ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Delete Date Range</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.range?.name}</strong>? 
              All associated utilization data will be permanently lost and cannot be recovered.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteRange}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRange}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Date Range
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Utilization Grid */}
      {activeDateRange ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Resource Utilization Grid (%) - {activeDateRange.name}
            </h2>
            <div className="text-sm text-gray-600">
              {new Date(activeDateRange.start_date).toLocaleDateString()} - {new Date(activeDateRange.end_date).toLocaleDateString()}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3 border-b">Resource</th>
                  {activeProjects.map(project => (
                    <th key={project.id} className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider p-3 border-b min-w-[100px]">
                      {project.shortName}
                    </th>
                  ))}
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider p-3 border-b bg-blue-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {activeResources.map(resource => (
                  <tr key={resource.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-sm font-medium text-gray-900 border-r">
                      <div>
                        <div className="font-semibold">{resource.name}</div>
                        <div className="text-xs text-gray-500">{resource.department}</div>
                      </div>
                    </td>
                    {activeProjects.map(project => {
                      const currentValue = getUtilization(resource.id, project.id);
                      return (
                        <td key={project.id} className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentValue}
                            onChange={(e) => updateUtilization(resource.id, project.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold bg-blue-50">
                      <span className={`px-2 py-1 rounded text-sm ${getUtilizationColor(getResourceTotal(resource.id))}`}>
                        {getResourceTotal(resource.id)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Project Totals Row */}
                <tr className="bg-green-50 border-t-2 border-green-200">
                  <td className="p-3 text-sm font-bold text-gray-900">Project Totals</td>
                  {activeProjects.map(project => (
                    <td key={project.id} className="p-3 text-center font-bold">
                      <span className={`px-2 py-1 rounded text-sm ${getUtilizationColor(getProjectTotal(project.id))}`}>
                        {getProjectTotal(project.id)}%
                      </span>
                    </td>
                  ))}
                  <td className="p-3 text-center font-bold bg-blue-100">
                    <span className="text-blue-800">
                      {Math.round(utilizations.reduce((sum, u) => sum + u.utilization, 0) / 100)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {activeResources.length === 0 || activeProjects.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeResources.length === 0 ? 'No active resources found' : 'No active projects found'}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Date Range</h3>
            <p className="text-gray-500 mb-4">
              Create and activate a date range to start tracking resource utilization.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Date Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}