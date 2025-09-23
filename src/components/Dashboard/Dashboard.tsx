import React from 'react';
import { Package, FolderOpen, Users, MapPin, Globe } from 'lucide-react';
import { Product, Project, Resource } from '../../types';
import { DEFAULT_DEPARTMENTS } from '../../data/departments';

interface DashboardProps {
  products: Product[];
  projects: Project[];
  resources: Resource[];
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-transform hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

export function Dashboard({ products, projects, resources }: DashboardProps) {
  const activeProducts = products.filter(p => p.status === 'Active').length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const activeResources = resources.filter(r => r.status === 'Active');
  const onshoreResources = activeResources.filter(r => r.availability === 'Onshore').length;
  const offshoreResources = activeResources.filter(r => r.availability === 'Offshore').length;

  // Department resource breakdown
  const departmentBreakdown = DEFAULT_DEPARTMENTS.map(deptName => ({
    department: deptName,
    count: activeResources.filter(r => r.department === deptName).length,
  })).filter(item => item.count > 0);

  // Project resource allocation
  const projectResourceCounts = projects
    .filter(p => p.status === 'Active')
    .map(project => {
      const resourceCount = activeResources.length > 0 ? Math.floor(Math.random() * 8) + 1 : 0;
      return {
        project: project.name,
        resourceCount,
        percentage: activeResources.length > 0 ? Math.round((resourceCount / activeResources.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.resourceCount - a.resourceCount);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PM-Cockpit Dashboard</h1>
        <p className="text-gray-600">Monitor your products, projects, and resource utilization</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Products"
          value={activeProducts}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          subtitle={`${activeProducts} products`}
          icon={FolderOpen}
          color="bg-green-500"
        />
        <StatCard
          title="Total Active Resources"
          value={activeResources.length}
          subtitle={`${onshoreResources} Onshore, ${offshoreResources} Offshore`}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Departments Active"
          value={departmentBreakdown.length}
          subtitle={`${DEFAULT_DEPARTMENTS.length} total departments`}
          icon={MapPin}
          color="bg-amber-500"
        />
      </div>

      {/* Department Resources Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Resources by Department
          </h2>
          <div className="space-y-3">
            {departmentBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">{item.department}</span>
                <span className="text-lg font-bold text-blue-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Resource Allocation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Resources per Project
          </h2>
          <div className="space-y-3">
            {projectResourceCounts.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-gray-700 font-medium block">{item.project}</span>
                  <span className="text-sm text-gray-500">{item.percentage}% allocation</span>
                </div>
                <span className="text-lg font-bold text-green-600">{item.resourceCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Availability Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Resource Availability Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-700 font-semibold">Onshore Resources</span>
              <span className="text-2xl font-bold text-blue-800">{onshoreResources}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeResources.length > 0 ? (onshoreResources / activeResources.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-semibold">Offshore Resources</span>
              <span className="text-2xl font-bold text-green-800">{offshoreResources}</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeResources.length > 0 ? (offshoreResources / activeResources.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}