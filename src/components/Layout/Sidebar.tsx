import React from 'react';
import { BarChart3, Package, FolderOpen, Users, Calendar, Home, UserCog, Settings, LogOut, FileText } from 'lucide-react';
import { NavigationTab } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'resources', label: 'Resources', icon: Users },
  { id: 'utilization', label: 'Utilization', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'users', label: 'User Management', icon: UserCog, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-green-400" />
          <h1 className="text-xl font-bold">PM-Cockpit</h1>
        </div>
        
        {/* User Info */}
        <div className="mb-6 p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium">{user?.fullName}</div>
              <div className="text-xs text-slate-400">{user?.role}</div>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            // Hide admin-only items for non-admin users
            if (item.adminOnly && user?.role !== 'Admin') {
              return null;
            }
            
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? 'bg-green-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-slate-300 hover:text-white hover:bg-red-600"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}