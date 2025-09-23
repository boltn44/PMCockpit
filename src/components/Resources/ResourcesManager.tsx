import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Search, AlertTriangle } from 'lucide-react';
import { Resource } from '../../types';
import { resourceService } from '../../services/resourceService';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../contexts/ToastContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_DEPARTMENTS } from '../../data/departments';

interface ResourcesManagerProps {
  resources: Resource[];
  setResources: (resources: Resource[]) => void;
  onRefresh: () => void;
}

export function ResourcesManager({ resources, setResources, onRefresh }: ResourcesManagerProps) {
  const { showSuccess, showError } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; resource: Resource | null }>({ show: false, resource: null });
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    availability: 'Onshore' as const,
    status: 'Active' as const,
  });

  // Load departments
  React.useEffect(() => {
    const loadDepartments = async () => {
      try {
        if (isSupabaseConfigured) {
          const depts = await departmentService.getAll();
          setDepartments(depts.map(d => d.name));
        } else {
          // Fallback to default departments
          setDepartments(DEFAULT_DEPARTMENTS);
        }
      } catch (error) {
        console.error('Error loading departments:', error);
        // Fallback to default departments on error
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    };
    loadDepartments();
  }, []);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || resource.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSupabaseConfigured) {
        if (editingResource) {
          await resourceService.update(editingResource.id, formData);
        } else {
          await resourceService.create(formData);
        }
        await onRefresh();
      } else {
        // Fallback to localStorage
        if (editingResource) {
          const updatedResources = resources.map(r => 
            r.id === editingResource.id ? { ...editingResource, ...formData } : r
          );
          setResources(updatedResources);
        } else {
          const newResource: Resource = {
            id: uuidv4(),
            ...formData,
          };
          setResources([...resources, newResource]);
        }
      }
      
      resetForm();
      showSuccess(
        editingResource ? 'Resource Updated' : 'Resource Created',
        `${formData.name} has been ${editingResource ? 'updated' : 'created'} successfully.`
      );
    } catch (error) {
      console.error('Error saving resource:', error);
      showError('Error Saving Resource', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      department: '',
      availability: 'Onshore',
      status: 'Active',
    });
    setEditingResource(null);
    setIsFormOpen(false);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      designation: resource.designation,
      department: resource.department,
      availability: resource.availability,
      status: resource.status,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const resourceToDelete = resources.find(r => r.id === id);
    if (resourceToDelete) {
      setDeleteConfirm({ show: true, resource: resourceToDelete });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.resource) return;
    
    try {
      if (isSupabaseConfigured) {
        await resourceService.delete(deleteConfirm.resource.id);
        await onRefresh();
      } else {
        // Fallback to localStorage
        const updatedResources = resources.filter(r => r.id !== deleteConfirm.resource!.id);
        setResources(updatedResources);
      }
      showSuccess('Resource Deleted', `${deleteConfirm.resource.name} has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting resource:', error);
      showError('Error Deleting Resource', 'Please try again.');
    } finally {
      setDeleteConfirm({ show: false, resource: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, resource: null });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            Resources Management
          </h1>
          <p className="text-gray-600 mt-2">Manage your team resources</p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">All Departments</option>
          {departments.map(deptName => (
            <option key={deptName} value={deptName}>{deptName}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(deptName => (
                    <option key={deptName} value={deptName}>{deptName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({...formData, availability: e.target.value as 'Onshore' | 'Offshore'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Onshore">Onshore</option>
                  <option value="Offshore">Offshore</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'In-Active'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="In-Active">In-Active</option>
                </select>
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
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingResource ? 'Update' : 'Create')}
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
              <h2 className="text-xl font-semibold text-gray-900">Delete Resource</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.resource?.name}</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Resources Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {resource.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {resource.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {resource.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      resource.availability === 'Onshore' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {resource.availability}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      resource.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {resource.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}