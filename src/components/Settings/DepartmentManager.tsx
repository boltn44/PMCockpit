import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { Department } from '../../types';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../contexts/ToastContext';

interface DepartmentManagerProps {
  canEdit: boolean;
}

export function DepartmentManager({ canEdit }: DepartmentManagerProps) {
  const { showSuccess, showError } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; department: Department | null }>({ show: false, department: null });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDepartmentName.trim()) return;
    
    try {
      const newDepartment = await departmentService.create(newDepartmentName.trim());
      setDepartments([...departments, newDepartment]);
      setNewDepartmentName('');
      setIsAdding(false);
      showSuccess('Department Added', `${newDepartmentName.trim()} has been added successfully.`);
    } catch (error) {
      console.error('Error adding department:', error);
      showError('Error Adding Department', 'Please try again.');
    }
  };

  const handleEdit = (department: Department) => {
    setEditingId(department.id);
    setEditingName(department.name);
  };

  const handleSave = async (id: string) => {
    if (!editingName.trim()) return;
    
    try {
      const updatedDepartment = await departmentService.update(id, editingName.trim());
      setDepartments(departments.map(d => d.id === id ? updatedDepartment : d));
      setEditingId(null);
      setEditingName('');
      showSuccess('Department Updated', `Department has been updated successfully.`);
    } catch (error) {
      console.error('Error updating department:', error);
      showError('Error Updating Department', 'Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    const departmentToDelete = departments.find(d => d.id === id);
    if (departmentToDelete) {
      setDeleteConfirm({ show: true, department: departmentToDelete });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.department) return;
    
    try {
      await departmentService.delete(deleteConfirm.department.id);
      setDepartments(departments.filter(d => d.id !== deleteConfirm.department!.id));
      showSuccess('Department Deleted', `${deleteConfirm.department.name} has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting department:', error);
      showError('Error Deleting Department', 'It may be in use by existing resources.');
    } finally {
      setDeleteConfirm({ show: false, department: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, department: null });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
    setIsAdding(false);
    setNewDepartmentName('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Department Management
        </h2>
        {canEdit && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Add new department form */}
        {isAdding && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <input
              type="text"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="Enter department name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Department list */}
        {departments.map((department) => (
          <div key={department.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            {editingId === department.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  autoFocus
                />
                <button
                  onClick={() => handleSave(department.id)}
                  className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-gray-700 font-medium">{department.name}</span>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(department)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(department.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {departments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No departments found. Add your first department to get started.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Delete Department</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.department?.name}</strong>? 
              This action cannot be undone and may affect existing resources.
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
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}

      {!canEdit && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
          You don't have permission to modify departments. Contact an administrator for changes.
        </div>
      )}
    </div>
  );
}