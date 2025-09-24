import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginScreen } from './components/Auth/LoginScreen';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProductsManager } from './components/Products/ProductsManager';
import { ProjectsManager } from './components/Projects/ProjectsManager';
import { ResourcesManager } from './components/Resources/ResourcesManager';
import { ResourceUtilizationManager } from './components/Utilization/ResourceUtilization';
import { UtilizationReport } from './components/Reports/UtilizationReport';
import { UsersManager } from './components/Users/UsersManager';
import { SettingsManager } from './components/Settings/SettingsManager';
import { useLocalStorage } from './hooks/useLocalStorage';
import { productService } from './services/productService';
import { projectService } from './services/projectService';
import { resourceService } from './services/resourceService';
import { migrateProductsData, migrateProjectsData, migrateResourcesData, clearUtilizationData } from './utils/dataMigration';
import { NavigationTab, Product, Project, Resource, User, Settings } from './types';
import { isSupabaseConfigured, testSupabaseConnection } from './lib/supabase';

// Clean initial data - only keep users for authentication
const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@pmcockpit.com',
    fullName: 'System Administrator',
    role: 'Admin',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    username: 'manager',
    email: 'manager@pmcockpit.com',
    fullName: 'Project Manager',
    role: 'Manager',
    status: 'Active',
    createdAt: '2024-01-02T00:00:00Z',
    lastLogin: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    username: 'user',
    email: 'user@pmcockpit.com',
    fullName: 'Team Member',
    role: 'User',
    status: 'Active',
    createdAt: '2024-01-03T00:00:00Z',
  },
];

const defaultSettings: Settings = {
  companyName: 'PM-Cockpit Solutions',
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  currency: 'USD',
  timezone: 'UTC',
  emailNotifications: true,
  autoLogout: 60,
};

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useLocalStorage<User[]>('pm-cockpit-users', initialUsers);
  const [settings, setSettings] = useLocalStorage<Settings>('pm-cockpit-settings', defaultSettings);
  const [products, setProducts] = useLocalStorage<Product[]>('pm-cockpit-products', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('pm-cockpit-projects', []);
  const [resources, setResources] = useLocalStorage<Resource[]>('pm-cockpit-resources', []);

  // Load data from Supabase and migrate localStorage data
  React.useEffect(() => {
    const loadAndMigrateData = async () => {
      try {
        setLoading(true);
        
        // Test Supabase connection first
        if (isSupabaseConfigured) {
          console.log('Testing Supabase connection...');
          const connectionTest = await testSupabaseConnection();
          if (connectionTest) {
            console.log('Using Supabase for data storage');
            // Load data from Supabase
            await refreshProducts();
            await refreshProjects();
            await refreshResources();
          } else {
            console.warn('Supabase connection failed, falling back to localStorage');
          }
        } else {
          console.log('Supabase not configured, using localStorage for data storage');
        }
        
        // Ensure any existing localStorage data is properly migrated
        let localProducts = JSON.parse(localStorage.getItem('pm-cockpit-products') || '[]');
        let localProjects = JSON.parse(localStorage.getItem('pm-cockpit-projects') || '[]');
        let localResources = JSON.parse(localStorage.getItem('pm-cockpit-resources') || '[]');
        
        // Migrate data to use proper UUIDs if needed
        if (localProducts.length > 0) {
          const migratedProducts = migrateProductsData(localProducts);
          if (JSON.stringify(migratedProducts) !== JSON.stringify(localProducts)) {
            setProducts(migratedProducts);
          }
        }
        
        if (localProjects.length > 0) {
          const migratedProjects = migrateProjectsData(localProjects);
          if (JSON.stringify(migratedProjects) !== JSON.stringify(localProjects)) {
            setProjects(migratedProjects);
          }
        }
        
        if (localResources.length > 0) {
          const migratedResources = migrateResourcesData(localResources);
          if (JSON.stringify(migratedResources) !== JSON.stringify(localResources)) {
            setResources(migratedResources);
          }
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadAndMigrateData();
    }
  }, [user]);

  const refreshProducts = async () => {
    try {
      if (isSupabaseConfigured) {
        const data = await productService.getAll();
        setProducts(data);
      } else {
        console.log('Supabase not configured, keeping localStorage data');
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const refreshProjects = async () => {
    try {
      if (isSupabaseConfigured) {
        const data = await projectService.getAll();
        setProjects(data);
      } else {
        console.log('Supabase not configured, keeping localStorage data');
      }
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  };

  const refreshResources = async () => {
    try {
      if (isSupabaseConfigured) {
        const data = await resourceService.getAll();
        setResources(data);
      } else {
        console.log('Supabase not configured, keeping localStorage data');
      }
    } catch (error) {
      console.error('Error refreshing resources:', error);
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application data...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard products={products} projects={projects} resources={resources} />;
      case 'products':
        return <ProductsManager products={products} setProducts={setProducts} onRefresh={refreshProducts} />;
      case 'projects':
        return <ProjectsManager projects={projects} setProjects={setProjects} products={products} onRefresh={refreshProjects} />;
      case 'resources':
        return <ResourcesManager resources={resources} setResources={setResources} onRefresh={refreshResources} />;
      case 'utilization':
        return <ResourceUtilizationManager resources={resources} projects={projects} />;
      case 'reports':
        return <UtilizationReport resources={resources} projects={projects} />;
      case 'users':
        return <UsersManager users={users} setUsers={setUsers} />;
      case 'settings':
        return <SettingsManager settings={settings} setSettings={setSettings} />;
      default:
        return <Dashboard products={products} projects={projects} resources={resources} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}



function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;